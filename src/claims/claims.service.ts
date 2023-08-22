import { Injectable } from '@nestjs/common';
import { Claim, ClaimStatus } from './entities/claim.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InitiatedClaimEventDto } from 'src/core/dto/initiated-claim-event.dto';
import { ClaimItem, ClaimItemStatus } from './entities/claim-item.entity';
import { ClaimItemType } from 'src/core/enums';
import { NonMedicalFWAEventDto } from 'src/core/dto/non-medical-fwa-event.dto';
import { NonMedicalAdjEventDto } from 'src/core/dto/non-medical-adj-event.dto';
import { FileUploadService } from 'src/core/providers/file-upload/file-upload.service';
import { ClaimItemDocument } from './entities/claim-item-document.entity';
import { MedicalAdjEventDto } from 'src/core/dto/medical-adj-event.dto';
import { AdjudicationItemStatus } from 'src/claims-adjudication/entities/adjudication-item.entity';
import { MedicalFWAEventDto } from 'src/core/dto/medical-fwa-event.dto';

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
      claimItemType: ClaimItemType.INTIAL,
      claimItemStatus: ClaimItemStatus.INITIATED,
      totalAmount: claim.totalClaimAmount,
    });

    claim.addNewClaimItem(newClaimItem);

    await this.claimRepository.save(claim);

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

  async processDocumentUpload(claimItemId, files: Array<Express.Multer.File>) {
    const claimItem = await this.claimItemRepository.findOneBy({
      id: claimItemId,
    });

    const documents: ClaimItemDocument[] = [];

    for (const file of files) {
      const { originalname: filename } = file;
      const { fileUrl } = await this.fileUploadService.uploadFile(file);

      const document = new ClaimItemDocument({
        filename,
        fileUrl,
      });

      documents.push(document);
    }

    claimItem.addDocuments(documents);

    //save the documents
    await this.claimItemRepository.save(claimItem);
    console.log('Documents saved against claimItem...');

    return claimItem;
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

  remove(id: number) {
    return this.claimRepository.delete(id);
  }
}
