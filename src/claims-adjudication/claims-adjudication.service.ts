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
    const { policyDetails, hospitalDetails, claimItemTotalAmount } =
      adjudicationItem;

    const fwaProcessParams = {
      pincode: hospitalDetails.hospitalPincode,
      frequency: policyDetails.totalNumberOfClaims,
      amount: claimItemTotalAmount,
      sumInsured: policyDetails.sumInsured,
    };

    try {
      console.log('Non medical adjudication rule engine invoked...');
      const {
        nonMedFWADecision: { fwaDecision, fwaReason },
      } = await this.camundaClientService.getOutcome<NonMedicalFWAOutcomeDto>(
        this.NON_MEDICAL_FWA_PROCESS_ID,
        fwaProcessParams,
      );

      console.log('Rule engine result:', fwaDecision);

      adjudicationItem.addNonMedicalFWAResult(fwaDecision, fwaReason);
    } catch (error) {
      console.log('Error occured while running non medical FWA rule engine');
      adjudicationItem.status = AdjudicationItemStatus.NON_MEDICAL_FWA_FAILED;
    }

    return adjudicationItem;
  }

  async performMedicalFWA(claimItemId: number) {
    // Fetch AdjudicationItem
    const adjudicationItem = await this.adjudicationItemRepository.findOne({
      where: { claimItemId: claimItemId },
      relations: {
        doctorTreatmentDetails: true,
      },
    });

    const {
      claimItemTotalAmount,
      doctorTreatmentDetails: { ICD11Code },
    } = adjudicationItem;

    //perform FWA check
    const fwaProcessParams = {
      ICD11Code,
      claimAmount: parseFloat(claimItemTotalAmount.toString()),
    };

    try {
      console.log('Medical adjudication rule engine invoked...');
      const {
        medFWADecision: { fwaDecision, fwaReason },
      } = await this.camundaClientService.getOutcome<MedicalFWAOutcomeDto>(
        this.MEDICAL_FWA_PROCESS_ID,
        fwaProcessParams,
      );
      console.log('Rule engine result:', fwaDecision);

      adjudicationItem.addMedicalFWAResult(fwaDecision, fwaReason);
    } catch (error) {
      console.log('Error occured while running medical FWA rule engine');
      adjudicationItem.status = AdjudicationItemStatus.MEDICAL_FWA_FAILED;
    }

    // save adjudication item
    await this.adjudicationItemRepository.save(adjudicationItem);
    console.log('Medical FWA decision saved against adjudicationItem...');

    return adjudicationItem;
  }

  async saveNonMedicalAdjResult(
    claimItemId: number,
    nonMedicalAdjudicationResult: NonMedicalAdjudicationResult,
  ) {
    const adjudicationItem = await this.adjudicationItemRepository.findOneBy({
      claimItemId: claimItemId,
    });
    adjudicationItem.addNonMedicalAdjudicationResult(
      nonMedicalAdjudicationResult,
    );
    await this.adjudicationItemRepository.save(adjudicationItem);

    return adjudicationItem;
  }

  async saveMedicalAdjResult(
    claimItemId: number,
    medicalAdjudicationResult: MedicalAdjudicationResult,
  ) {
    const adjudicationItem = await this.adjudicationItemRepository.findOneBy({
      claimItemId: claimItemId,
    });

    adjudicationItem.addMedicalAdjudicationResult(medicalAdjudicationResult);

    await this.adjudicationItemRepository.save(adjudicationItem);

    return adjudicationItem;
  }

  async saveAdjudicationItem(adjudicationItem: AdjudicationItem) {
    console.log('Saving adjudication item...');
    await this.adjudicationItemRepository.save(adjudicationItem);
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
        medicalAdjudicationResult: {
          variations: true,
        },
      },
    });
  }

  async findAdjudicationItemByClaimId(claimId: number) {
    return await this.adjudicationItemRepository.findOne({
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
        medicalAdjudicationResult: {
          variations: true,
        },
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
          medicalAdjudicationResult: {
            variations: true,
          },
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
          medicalAdjudicationResult: {
            variations: true,
          },
        },
      },
    );

    return medicalAdjudicationitems;
  }
}
