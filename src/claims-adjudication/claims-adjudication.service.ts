import { Injectable } from '@nestjs/common';
import {
  AdjudicationItem,
  AdjudicationItemStatus,
} from './entities/adjudication-item.entity';
import { PolicyDetails } from './entities/policy-details.entity';
import { MemberDetails } from './entities/member-details.entity';
import { HospitalDetails } from './entities/hospital-details.entity';
import { CamundaClientService } from 'src/core/providers/camunda-client/camunda-client.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NonMedicalFWAOutcomeDto } from 'src/core/dto/non-medical-fwa-outcome.dto';
import { NonMedicalAdjudicationResult } from './entities/non-medical-adjudication-result.entity';
import { MedicalFWAOutcomeDto } from 'src/core/dto/medical-fwa-outcome.dto';
import { MedicalAdjudicationResult } from './entities/medical-adjudication-result.entity';

@Injectable()
export class ClaimsAdjudicationService {
  readonly NON_MEDICAL_FWA_PROCESS_ID = 'nonMedicalFWAProcess';
  readonly MEDICAL_FWA_PROCESS_ID = 'medicalFWAProcess';

  constructor(
    @InjectRepository(AdjudicationItem, 'claims-adjudication')
    private adjudicationItemRepository: Repository<AdjudicationItem>,
    private camundaClientService: CamundaClientService,
  ) {}

  async performNonMedicalFWA(adjudicationItem: AdjudicationItem) {
    const {
      policyNumber,
      insuranceCardNumber,
      hospitalId,
      claimItemTotalAmount,
    } = adjudicationItem;

    // use the policy, hospital and member Id to call APIs of Policy service and get Policy and member level details
    const policyDetails = new PolicyDetails({
      policyId: policyNumber,
      sumInsured: 10000000.5, // FWA-params
      startDate: new Date('01/01/2023'),
      endDate: new Date('12/30/2023'),
      policyBenefits: 'All Critical Illness',
      policyDeductions: 0.0,
      policyCapping: null,
      policyWaitingPeriod: 0,
      totalNumberOfClaims: 3, // FWA-params
    });

    const memberDetails = new MemberDetails({
      memberId: insuranceCardNumber,
      policyId: policyNumber,
      sumInsured: 10000000.5,
      contactNumber: '9972976940',
      email: 'akashmanoj213@gmail.com',
      communicationPreference: 'whatsapp',
      exclusions: 'NA',
      memberBenefits: 'All Critical Illness',
      memberDeductions: 0.0,
      memberCapping: null,
      memberWaitingPeriod: 0,
      numberOfClaims: 0,
    });

    const hospitalDetails = new HospitalDetails({
      hospitalId: hospitalId,
      hospitalName: 'Appolo Multi Speciality',
      hospitalLocation: 'Bangalore',
      hospitalEmailId: 'appolo-bangalore@gmail.com',
      rohiniId: 12876,
      hospitalPincode: '560037', // FWA-params
    });

    adjudicationItem.policyDetails = policyDetails;
    adjudicationItem.memberDetails = memberDetails;
    adjudicationItem.hospitalDetails = hospitalDetails;

    //perform FWA check
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

    // save adjudication item
    await this.adjudicationItemRepository.save(adjudicationItem);
    console.log('Non Medical FWA decision saved against adjudicationItem...');

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

  async findOne(id: number) {
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

  async findOneByClaimItemId(claimItemId: number) {
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
        nonMedicalAdjudicationResult: true,
        medicalAdjudicationResult: true,
      },
    });
  }

  update(id: number) {
    return `This action updates a #${id} claimsAdjudication`;
  }

  remove(id: number) {
    return `This action removes a #${id} claimsAdjudication`;
  }
}
