import { Injectable } from '@nestjs/common';
import {
  AdjudicationItem,
  AdjudicationItemStatus,
} from './entities/adjudication-item.entity';
import { CamundaClientService } from 'src/core/providers/camunda-client/camunda-client.service';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EntityManager,
  EntityTarget,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { NonMedicalFWAOutcomeDto } from 'src/core/dto/non-medical-fwa-outcome.dto';
import { NonMedicalAdjudicationResult } from './entities/non-medical-adjudication-result.entity';
import { MedicalFWAOutcomeDto } from 'src/core/dto/medical-fwa-outcome.dto';
import { MedicalAdjudicationResult } from './entities/medical-adjudication-result.entity';

@Injectable()
export class ClaimsAdjudicationService {
  private readonly NON_MEDICAL_FWA_PROCESS_ID = 'nonMedicalFWAProcess';
  private readonly MEDICAL_FWA_PROCESS_ID = 'medicalFWAProcess';

  constructor(
    @InjectRepository(AdjudicationItem, 'claims-adjudication')
    private adjudicationItemRepository: Repository<AdjudicationItem>,
    private entityManger: EntityManager,
    private camundaClientService: CamundaClientService,
  ) {}

  async performNonMedicalFWA(adjudicationItem: AdjudicationItem) {
    console.log('Performing non-medical FWA.');
    const { policyDetails, hospitalDetails, claimItemTotalAmount } =
      adjudicationItem;

    const fwaProcessParams = {
      pincode: hospitalDetails.hospitalPincode,
      frequency: policyDetails.totalNumberOfClaims,
      amount: claimItemTotalAmount,
      sumInsured: policyDetails.sumInsured,
    };

    let nonMedicalFWAResult,
      nonMedicalFWAReason,
      isFailure = false;

    try {
      console.log('Non medical FWA rule engine invoked.');
      const {
        nonMedFWADecision: { fwaDecision, fwaReason },
      } = await this.camundaClientService.getOutcome<NonMedicalFWAOutcomeDto>(
        this.NON_MEDICAL_FWA_PROCESS_ID,
        fwaProcessParams,
      );

      nonMedicalFWAResult = fwaDecision;
      nonMedicalFWAReason = fwaReason;

      console.log('Non medical adj rule engine result: ', nonMedicalFWAResult);
    } catch (error) {
      console.log(
        `Error occured while running non medical FWA rule engine ! Error: ${error.message}`,
      );
      isFailure = true;
    }

    adjudicationItem.updateNonMedicalFWAResult(
      nonMedicalFWAResult,
      nonMedicalFWAReason,
      isFailure,
    );

    return adjudicationItem;
  }

  async saveNonMedicalAdjResult(
    claimItemId: number,
    nonMedicalAdjudicationResult: NonMedicalAdjudicationResult,
  ) {
    const adjudicationItem = await this.adjudicationItemRepository.findOneBy({
      claimItemId: claimItemId,
    });

    if (!adjudicationItem) {
      throw new Error(
        `Adjudication item not found for claim item ID: ${claimItemId}. Please complete file upload for the claim item.`,
      );
    }

    adjudicationItem.updateNonMedicalAdjudicationResult(
      nonMedicalAdjudicationResult,
    );
    await this.adjudicationItemRepository.save(adjudicationItem);
    console.log('Non medical adjudication result saved.');

    return adjudicationItem;
  }

  async performMedicalFWA(adjudicationItem: AdjudicationItem) {
    console.log('Performing medical FWA.');

    const {
      claimItemTotalAmount,
      doctorTreatmentDetails: { ICD11Code },
    } = adjudicationItem;

    //perform FWA check
    const fwaProcessParams = {
      ICD11Code,
      claimAmount: parseFloat(claimItemTotalAmount.toString()),
    };

    let medicalFWAResult,
      medicalFWAReason,
      isFailure = false;

    try {
      console.log('Medical adjudication rule engine invoked.');
      const {
        medFWADecision: { fwaDecision, fwaReason },
      } = await this.camundaClientService.getOutcome<MedicalFWAOutcomeDto>(
        this.MEDICAL_FWA_PROCESS_ID,
        fwaProcessParams,
      );

      medicalFWAResult = fwaDecision;
      medicalFWAReason = fwaReason;

      console.log('Medical adj rule engine result: ', medicalFWAResult);
    } catch (error) {
      console.log(
        `Error occured while running medical FWA rule engine ! Error: ${error.message}`,
      );
      isFailure = true;
    }

    adjudicationItem.updateMedicalFWAResult(
      medicalFWAResult,
      medicalFWAReason,
      isFailure,
    );

    return adjudicationItem;
  }

  async saveMedicalAdjResult(
    claimItemId: number,
    medicalAdjudicationResult: MedicalAdjudicationResult,
  ) {
    const adjudicationItem = await this.adjudicationItemRepository.findOneBy({
      claimItemId: claimItemId,
    });

    if (!adjudicationItem) {
      throw new Error(
        `Adjudication item not found for claim item ID: ${claimItemId}. Please complete file upload for the claim item.`,
      );
    }

    adjudicationItem.updateMedicalAdjudicationResult(medicalAdjudicationResult);

    await this.adjudicationItemRepository.save(adjudicationItem);
    console.log('Medical adjudication result saved.');

    return adjudicationItem;
  }

  async saveAdjudicationItem(adjudicationItem: AdjudicationItem) {
    const result = await this.adjudicationItemRepository.save(adjudicationItem);
    console.log(`Adjudication item saved! adjudicationItemId: ${result.id}.`);

    return result;
  }

  async findAdjudicationItem(id: number) {
    return await this.adjudicationItemRepository.findOne({
      where: {
        id,
      },
      relations: {
        documents: true,
        patientAdmissionDetails: { pastHistoryOfChronicIllness: true },
        doctorTreatmentDetails: true,
        accidentDetails: true,
        maternityDetails: true,
        policyDetails: true,
        memberDetails: true,
        hospitalDetails: true,
        nonMedicalAdjudicationResult: true,
        medicalAdjudicationResult: true,
      },
    });
  }

  async findAdjudicationItemByClaimItemId(claimItemId: number) {
    return await this.adjudicationItemRepository.findOne({
      where: {
        claimItemId,
      },
      relations: {
        documents: true,
        patientAdmissionDetails: { pastHistoryOfChronicIllness: true },
        doctorTreatmentDetails: true,
        accidentDetails: true,
        maternityDetails: true,
        policyDetails: true,
        memberDetails: true,
        hospitalDetails: true,
        nonMedicalAdjudicationResult: {
          variations: true,
        },
        medicalAdjudicationResult: true,
      },
    });
  }

  async findAdjudicationItemsByClaimId(claimId: number) {
    return await this.adjudicationItemRepository.find({
      where: {
        claimId,
      },
      relations: {
        documents: true,
        patientAdmissionDetails: { pastHistoryOfChronicIllness: true },
        doctorTreatmentDetails: true,
        accidentDetails: true,
        maternityDetails: true,
        policyDetails: true,
        memberDetails: true,
        hospitalDetails: true,
        nonMedicalAdjudicationResult: {
          variations: true,
        },
        medicalAdjudicationResult: true,
      },
      order: {
        id: 'DESC',
      },
    });
  }

  async findEntity(entity: EntityTarget<ObjectLiteral>, id: number) {
    return await this.entityManger.findOneBy(entity, { id });
  }

  async getNonMedicalAdjudicationItems() {
    const nonMedicalAdjudicationitems =
      await this.adjudicationItemRepository.find({
        where: [
          { status: AdjudicationItemStatus.NON_MEDICAL_FWA_COMPLETED },
          { status: AdjudicationItemStatus.NON_MEDICAL_FWA_FAILED },
        ],
        relations: {
          documents: true,
          patientAdmissionDetails: { pastHistoryOfChronicIllness: true },
          doctorTreatmentDetails: true,
          accidentDetails: true,
          maternityDetails: true,
          policyDetails: true,
          memberDetails: true,
          hospitalDetails: true,
          nonMedicalAdjudicationResult: {
            variations: true,
          },
          medicalAdjudicationResult: true,
        },
        order: {
          id: 'DESC',
        },
      });

    return nonMedicalAdjudicationitems;
  }

  async getMedicalAdjudicationItems() {
    const medicalAdjudicationitems = await this.adjudicationItemRepository.find(
      {
        where: [
          { status: AdjudicationItemStatus.MEDICAL_FWA_COMPLETED },
          { status: AdjudicationItemStatus.MEDICAL_FWA_FAILED },
        ],
        relations: {
          documents: true,
          patientAdmissionDetails: { pastHistoryOfChronicIllness: true },
          doctorTreatmentDetails: true,
          accidentDetails: true,
          maternityDetails: true,
          policyDetails: true,
          memberDetails: true,
          hospitalDetails: true,
          nonMedicalAdjudicationResult: {
            variations: true,
          },
          medicalAdjudicationResult: true,
        },
        order: {
          id: 'DESC',
        },
      },
    );

    return medicalAdjudicationitems;
  }
}
