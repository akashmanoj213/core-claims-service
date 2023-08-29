import { Injectable } from '@nestjs/common';
import { Claim, ClaimStatus } from './entities/claim.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClaimItem, ClaimItemStatus } from './entities/claim-item.entity';
import { NonMedicalFWAEventDto } from 'src/core/dto/non-medical-fwa-event.dto';
import { NonMedicalAdjEventDto } from 'src/core/dto/non-medical-adj-event.dto';
import { FileUploadService } from 'src/core/providers/file-upload/file-upload.service';
import { ClaimItemDocument } from './entities/claim-item-document.entity';
import { MedicalAdjEventDto } from 'src/core/dto/medical-adj-event.dto';
import { AdjudicationItemStatus } from 'src/claims-adjudication/entities/adjudication-item.entity';
import { MedicalFWAEventDto } from 'src/core/dto/medical-fwa-event.dto';
import { FileUploadResponseDto } from 'src/core/dto/file-upload-response.dto';

@Injectable()
export class ClaimsService {
  constructor(
    @InjectRepository(Claim)
    private claimRepository: Repository<Claim>,
    @InjectRepository(ClaimItem)
    private claimItemRepository: Repository<ClaimItem>,
    private fileUploadService: FileUploadService,
  ) {}

  async initiateClaim(claim: Claim) {
    claim.claimStatus = ClaimStatus.INITIATED;

    const newClaimItem = new ClaimItem({
      totalAmount: claim.totalClaimAmount,
    });

    claim.addNewClaimItem(newClaimItem);

    return claim;
  }

  async updateNonMedicalFWAResults(
    nonMedicalFWAEventDto: NonMedicalFWAEventDto,
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
  }

  async updateNonMedicalAdjesults(
    nonMedicalAdjEventDto: NonMedicalAdjEventDto,
  ) {
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

  async updateMedicalFWAResults(medicalFWAEventDto: MedicalFWAEventDto) {
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

  async updateMedicalAdjResults(medicalAdjEventDto: MedicalAdjEventDto) {
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
        },
        documents: true,
      },
    });
  }

  saveClaim(claim: Claim) {
    return this.claimRepository.save(claim);
  }

  saveClaimItem(claimItem: ClaimItem) {
    return this.claimItemRepository.save(claimItem);
  }

  remove(id: number) {
    return this.claimRepository.delete(id);
  }
}
