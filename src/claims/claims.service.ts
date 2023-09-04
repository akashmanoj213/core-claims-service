import { Injectable } from '@nestjs/common';
import { Claim, ClaimStatus } from './entities/claim.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClaimItem, ClaimItemStatus } from './entities/claim-item.entity';
import { NonMedicalFWACompletedEventDto } from 'src/core/dto/non-medical-fwa-completed-event.dto';
import { NonMedicalAdjEventCompletedDto } from 'src/core/dto/non-medical-adj-completed-event.dto';
import { FileUploadService } from 'src/core/providers/file-upload/file-upload.service';
import { ClaimItemDocument } from './entities/claim-item-document.entity';
import { MedicalAdjCompletedEventDto } from 'src/core/dto/medical-adj-completed-event.dto';
import { AdjudicationItemStatus } from 'src/claims-adjudication/entities/adjudication-item.entity';
import { MedicalFWACompletedEventDto } from 'src/core/dto/medical-fwa-completed-event.dto';
import { FileUploadResponseDto } from 'src/core/dto/file-upload-response.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PolicyDetailsDto } from './dto/policy-details.dto';
import { MemberDetailsDto } from './dto/member-details.dto';
import { HospitalDetailsDto } from './dto/hospital-details.dto';
import { PolicyDetails } from './entities/policy-details.entity';
import { MemberDetails } from './entities/member-details.entity';
import { HospitalDetails } from './entities/hospital-details.entity';
import { VariationData } from './entities/variation-data-entity';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ClaimsService {
  private readonly MOCK_SERVICE_BASE_URL =
    'https://mock-service-dnhiaxv6nq-el.a.run.app';

  constructor(
    @InjectRepository(Claim)
    private claimRepository: Repository<Claim>,
    @InjectRepository(ClaimItem)
    private claimItemRepository: Repository<ClaimItem>,
    private fileUploadService: FileUploadService,
    private httpService: HttpService,
  ) {}

  async initiateAndVerifyClaim(claim: Claim) {
    const {
      policyNumber,
      insuranceCardNumber,
      hospitalId,
      tpaPolicyDetails,
      tpaHospitalDetails,
      tpaMemberDetails,
    } = claim;

    // use the policy, hospital and member Id to call APIs of Policy service and get Policy and member level details
    const policyServiceApiResponse = this.getPolicyDetails(policyNumber);
    const hospitalServiceApiResponse = this.getHospitalDetails(hospitalId);

    const [{ data: policyDetailsData }, { data: hospitalDetailsData }] =
      await Promise.all([policyServiceApiResponse, hospitalServiceApiResponse]);

    const policyDetailsDto: PolicyDetailsDto = plainToInstance(
      PolicyDetailsDto,
      policyDetailsData,
    );
    const memberDetailsDto: MemberDetailsDto = plainToInstance(
      MemberDetailsDto,
      policyDetailsData.members.find(
        (member) => member.id === insuranceCardNumber,
      ),
    );
    const hospitalDetailsDto: HospitalDetailsDto = plainToInstance(
      HospitalDetailsDto,
      hospitalDetailsData,
    );

    const policyDetails = new PolicyDetails({
      ...policyDetailsDto,
      policyId: policyDetailsDto.id,
      id: null,
    });
    const memberDetails = new MemberDetails({
      ...memberDetailsDto,
      memberId: memberDetailsDto.id,
      policyId: policyDetailsDto.id,
      id: null,
    });
    const hospitalDetails = new HospitalDetails({
      ...hospitalDetailsDto,
      hospitalId: hospitalDetailsDto.id,
      id: null,
    });

    claim.policyDetails = policyDetails;
    claim.memberDetails = memberDetails;
    claim.hospitalDetails = hospitalDetails;

    const variationData: VariationData[] = [];

    // check policy variation
    variationData.push(
      ...this.checkVariations(tpaPolicyDetails, policyDetails, 'policy'),
    );

    // check policy variation
    variationData.push(
      ...this.checkVariations(tpaMemberDetails, memberDetails, 'member'),
    );

    // check policy variation
    variationData.push(
      ...this.checkVariations(tpaHospitalDetails, hospitalDetails, 'hospital'),
    );

    if (variationData.length) {
      console.log('Variation detected...');
      claim.isVariationDetected = true;
      claim.claimStatus = ClaimStatus.VARIATIONS_DETECTED;
      claim.variations = variationData;
    } else {
      claim.claimStatus = ClaimStatus.INITIATED;
    }

    const newClaimItem = new ClaimItem({
      totalAmount: claim.totalClaimAmount,
    });

    claim.addNewClaimItem(newClaimItem);

    return claim;
  }

  getPolicyDetails(policyId) {
    return firstValueFrom(
      this.httpService.get(`${this.MOCK_SERVICE_BASE_URL}/policy/${policyId}`),
    ); // Check members is present or not
  }

  getHospitalDetails(hospitalId) {
    return firstValueFrom(
      this.httpService.get(
        `${this.MOCK_SERVICE_BASE_URL}/hospital/${hospitalId}`,
      ),
    );
  }

  // method does not handle nested fields
  checkVariations(objectToCheck: object, sourceObject: object, objectName) {
    const variationData: VariationData[] = [];

    Object.keys(objectToCheck).forEach((key) => {
      if (sourceObject[key] instanceof Date) {
        if (
          sourceObject[key].toDateString() !== objectToCheck[key].toDateString()
        ) {
          variationData.push(
            new VariationData({
              sectionName: objectName,
              originalStringValue: sourceObject[key].toDateString(),
              receivedStringValue: objectToCheck[key].toDateString(),
              fieldName: key,
            }),
          );
        }
      } else if (sourceObject[key] !== objectToCheck[key]) {
        if (typeof objectToCheck[key] === 'string') {
          variationData.push(
            new VariationData({
              sectionName: objectName,
              originalStringValue: sourceObject[key],
              receivedStringValue: objectToCheck[key],
              fieldName: key,
            }),
          );
        } else if (typeof objectToCheck[key] === 'number') {
          variationData.push(
            new VariationData({
              sectionName: objectName,
              originalDecimalValue: sourceObject[key],
              receivedDecimalValue: objectToCheck[key],
              fieldName: key,
            }),
          );
        } else {
          variationData.push(
            new VariationData({
              sectionName: objectName,
              originalStringValue: sourceObject[key]
                ? sourceObject[key].toString()
                : 'undefined',
              receivedStringValue: objectToCheck[key]
                ? objectToCheck[key].toString()
                : 'undefined',
              fieldName: key,
            }),
          );
        }
      }
    });

    return variationData;
  }

  async updateNonMedicalFWAResults(
    nonMedicalFWAEventDto: NonMedicalFWACompletedEventDto,
  ) {
    const {
      claimId,
      claimItemId,
      isFailure,
      nonMedicalFWAReason,
      nonMedicalFWAResult,
    } = nonMedicalFWAEventDto;

    const claim = await this.claimRepository.findOne({
      where: { id: claimId },
      relations: { claimItems: true },
    });

    // Update overall claim status to under review
    claim.claimStatus = ClaimStatus.UNDER_REVIEW;
    const claimItem = claim.claimItems.find(
      (claimItem) => claimItem.id === claimItemId,
    );

    // Update claimitem status to non-medical fwa completed or failed and nonMedicalFWA results.
    claimItem.claimItemStatus = isFailure
      ? ClaimItemStatus.NON_MEDICAL_FWA_FAILED
      : ClaimItemStatus.NON_MEDICAL_FWA_COMPLETED;
    claimItem.nonMedicalFWAReason = nonMedicalFWAReason;
    claimItem.nonMedicalFWAResult = nonMedicalFWAResult;

    //Save claim and claimItem
    await this.claimRepository.save(claim);

    return claim;
  }

  async updateNonMedicalAdjesults(
    nonMedicalAdjEventDto: NonMedicalAdjEventCompletedDto,
  ) {
    console.log(
      'Updating claim and claimItem status with non medical adj event results ...',
    );

    const { claimItemId, overallComment } = nonMedicalAdjEventDto;

    const claimItem = await this.claimItemRepository.findOneBy({
      id: claimItemId,
    });

    // Update claimitem status to non-medical review completed
    claimItem.claimItemStatus = ClaimItemStatus.NON_MEDICAL_REVIEW_COMPLETED;
    claimItem.nonMedicalAdjudicationResult = overallComment;

    //Save claimItem
    await this.claimItemRepository.save(claimItem);
  }

  async updateMedicalFWAResults(
    medicalFWAEventDto: MedicalFWACompletedEventDto,
  ) {
    const { claimItemId, isFailure, medicalFWAResult, medicalFWAReason } =
      medicalFWAEventDto;

    const claimItem = await this.claimItemRepository.findOne({
      where: { id: claimItemId },
    });

    // Update claimitem status to medical fwa completed or failed from MedicalFWA results.
    claimItem.claimItemStatus = isFailure
      ? ClaimItemStatus.MEDICAL_FWA_FAILED
      : ClaimItemStatus.MEDICAL_FWA_COMPLETED;
    claimItem.medicalFWAResult = medicalFWAResult;
    claimItem.medicalFWAReason = medicalFWAReason;

    //Save claimItem
    await this.claimItemRepository.save(claimItem);
  }

  async updateMedicalAdjResults(
    medicalAdjEventDto: MedicalAdjCompletedEventDto,
  ) {
    const { claimItemId, status, approvedPayableAmount, coPayableAmount } =
      medicalAdjEventDto;

    const claimItem = await this.claimItemRepository.findOne({
      where: {
        id: claimItemId,
      },
      relations: {
        claim: true,
      },
    });

    const claim = await this.claimRepository.findOneBy({
      id: claimItem.claim.id,
    });

    // Update claimitem status to appropriate status
    switch (status) {
      case AdjudicationItemStatus.APPROVED:
        claimItem.claimItemStatus = ClaimItemStatus.APPROVED;
        claimItem.approvedPayableAmount = approvedPayableAmount;
        claimItem.coPayableAmount = coPayableAmount;
        claim.approvedPayableAmount = approvedPayableAmount;
        claim.coPayableAmount = coPayableAmount;
        break;

      case AdjudicationItemStatus.REJECTED:
        claimItem.claimItemStatus = ClaimItemStatus.REJECTED;
        break;

      default:
        break;
    }

    //update claim status to review completed
    claim.claimStatus = ClaimStatus.REVIEW_COMPLETED;

    //Save claimItem and claim
    await this.claimItemRepository.save(claimItem);
    await this.claimRepository.save(claim);
  }

  async processDocumentUploads(files: Array<Express.Multer.File>) {
    const promises: Promise<FileUploadResponseDto>[] = new Array<
      Promise<FileUploadResponseDto>
    >();

    files.forEach((file) => {
      promises.push(this.fileUploadService.uploadFile(file));
    });

    const documentResponses = new Map<string, ClaimItemDocument>();

    const fileUploadResponses = await Promise.all(promises);

    fileUploadResponses.forEach((fileUploadResponse) => {
      const { fieldName, fileName, fileUrl, message } = fileUploadResponse;

      const document = new ClaimItemDocument({
        fieldName,
        fileName,
        fileUrl,
      });

      documentResponses.set(fieldName, document);
    });

    return documentResponses;
  }

  findAll() {
    return this.claimRepository.find({
      relations: {
        claimItems: true,
        tpaPolicyDetails: true,
        tpaMemberDetails: true,
        tpaHospitalDetails: true,
        doctorTreatmentDetails: true,
        patientAdmissionDetails: true,
        patientDeclaration: true,
        doctorDeclaration: true,
        hospitalDeclaration: true,
        maternityDetails: true,
        accidentDetails: true,
      },
    });
  }

  findClaim(id: number) {
    return this.claimRepository.findOne({
      where: {
        id,
      },
      relations: {
        claimItems: { documents: true },
        tpaPolicyDetails: true,
        tpaMemberDetails: true,
        tpaHospitalDetails: true,
        doctorTreatmentDetails: true,
        patientAdmissionDetails: true,
        patientDeclaration: true,
        doctorDeclaration: true,
        hospitalDeclaration: true,
        maternityDetails: true,
        accidentDetails: true,
        policyDetails: true,
        hospitalDetails: true,
        memberDetails: true,
        variations: true,
      },
    });
  }

  findClaimItem(id: number) {
    return this.claimItemRepository.findOne({
      where: {
        id,
      },
      relations: {
        claim: {
          tpaPolicyDetails: true,
          tpaMemberDetails: true,
          tpaHospitalDetails: true,
          doctorTreatmentDetails: true,
          patientAdmissionDetails: { pastHistoryOfChronicIllness: true },
          patientDeclaration: true,
          doctorDeclaration: true,
          hospitalDeclaration: true,
          maternityDetails: true,
          accidentDetails: true,
          policyDetails: true,
          hospitalDetails: true,
          memberDetails: true,
          variations: true,
        },
        documents: true,
      },
    });
  }

  saveClaim(claim: Claim) {
    console.log('Saving claim...');
    return this.claimRepository.save(claim);
  }

  saveClaimItem(claimItem: ClaimItem) {
    console.log('Saving claimItem...');
    return this.claimItemRepository.save(claimItem);
  }

  remove(id: number) {
    return this.claimRepository.delete(id);
  }
}