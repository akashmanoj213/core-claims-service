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
import { ClaimItemType } from 'src/core/enums';
import { PaymentStatusChangedEventDto } from 'src/core/dto/payment-status-changed-event.dto';
import { PaymentStatus } from 'src/core/enums/payment-status.enum';

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

    const variations: VariationData[] = [];

    if (policyDetailsData) {
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

      claim.policyDetails = policyDetails;
      claim.memberDetails = memberDetails;

      // check policy variation
      variations.push(
        ...this.checkVariations(tpaPolicyDetails, policyDetails, 'policy'),
      );

      // check member variation
      variations.push(
        ...this.checkVariations(tpaMemberDetails, memberDetails, 'member'),
      );
    } else {
      console.log(`No policy found with policy id: ${policyNumber} !`);
      // Add a variation with fieldName as "PolicyDetails" that signified that there is no policy data found
      const policyVariation = new VariationData({
        sectionName: 'policy',
        fieldName: 'PolicyDetails',
        receivedStringValue: 'No such policy found',
      });

      console.log(
        `No member found as policy with id: ${policyNumber} is missing !`,
      );
      // Add a variation with fieldName as "MemberDetails" that signified that there is no member data found
      const memberVariation = new VariationData({
        sectionName: 'member',
        fieldName: 'MemberDetails',
        receivedStringValue: 'No such member found',
      });

      variations.push(policyVariation, memberVariation);
    }

    if (hospitalDetailsData) {
      const hospitalDetailsDto: HospitalDetailsDto = plainToInstance(
        HospitalDetailsDto,
        hospitalDetailsData,
      );

      const hospitalDetails = new HospitalDetails({
        ...hospitalDetailsDto,
        hospitalId: hospitalDetailsDto.id,
        id: null,
      });

      claim.hospitalDetails = hospitalDetails;

      // check hospital variation
      variations.push(
        ...this.checkVariations(
          tpaHospitalDetails,
          hospitalDetails,
          'hospital',
        ),
      );
    } else {
      console.log(`No hospital found with hospital id: ${hospitalId}`);
      // Add a variation with fieldName as "HospitalDetails" that signified that there is no hospital data found
      const variationData = new VariationData({
        sectionName: 'hospital',
        fieldName: 'HospitalDetails',
        receivedStringValue: 'No such hospital found',
      });

      variations.push(variationData);
    }

    if (variations.length) {
      console.log('Variation detected...');
      claim.isVariationDetected = true;
      claim.claimStatus = ClaimStatus.VARIATIONS_DETECTED;
      claim.variations = variations;
    } else {
      claim.claimStatus = ClaimStatus.INITIATED;
    }

    const newClaimItem = new ClaimItem({
      claimItemType: ClaimItemType.INTIAL,
    });

    claim.addNewClaimItem(newClaimItem);

    return claim;
  }

  async createEnhancement(claimId: number, enhancementAmount: number) {
    const claim = await this.claimRepository.findOne({
      where: { id: claimId },
      relations: {
        claimItems: true,
      },
    });

    const newClaimItem = new ClaimItem({
      totalAmount: enhancementAmount,
      claimItemType: ClaimItemType.ENHANCEMENT,
    });

    claim.addNewClaimItem(newClaimItem);

    return claim;
  }

  async createFinalSubmission(claimId: number, remainingAmount: number) {
    const claim = await this.claimRepository.findOne({
      where: { id: claimId },
      relations: {
        claimItems: true,
      },
    });

    const newClaimItem = new ClaimItem({
      totalAmount: remainingAmount,
      claimItemType: ClaimItemType.FINAL,
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
    const {
      claimItemId,
      status,
      approvedPayableAmount,
      coPayableAmount,
      claimId,
    } = medicalAdjEventDto;

    const claimItem = await this.claimItemRepository.findOne({
      where: {
        id: claimItemId,
      },
    });

    const claim = await this.claimRepository.findOne({
      where: { id: claimId },
      relations: {
        hospitalDetails: true,
      },
    });

    // Update claimitem status to appropriate status
    switch (status) {
      case AdjudicationItemStatus.APPROVED:
        claimItem.approveClaimItem(approvedPayableAmount, coPayableAmount);
        claim.approveClaim(approvedPayableAmount, coPayableAmount);
        break;

      case AdjudicationItemStatus.REJECTED:
        claimItem.rejectClaimItem();
        claim.rejectClaim();
        break;

      default:
        break;
    }

    //Save claimItem and claim
    await this.claimItemRepository.save(claimItem);
    await this.claimRepository.save(claim);

    return claim;
  }

  async updatePaymentStatus(
    paymentStatusChangedEventDto: PaymentStatusChangedEventDto,
  ) {
    console.log('Updating claim payment status...');
    const { claimId, paymentStatus } = paymentStatusChangedEventDto;

    const claim = await this.claimRepository.findOneBy({ id: claimId });

    if (paymentStatus === PaymentStatus.PENDING) {
      claim.initiatePayment();
    } else if (paymentStatus === PaymentStatus.COMPLETED) {
      claim.completePayment();
    }

    await this.claimRepository.save(claim);
  }

  async processDocumentUploads(files: Array<Express.Multer.File>) {
    console.log('Uploading documents...');
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
