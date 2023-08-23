import { Injectable } from '@nestjs/common';
import {
  AdjudicationItem,
  AdjudicationItemStatus,
} from './entities/adjudication-item.entity';
import { HospitalDetails } from './entities/hospital-details.entity';
import { CamundaClientService } from 'src/core/providers/camunda-client/camunda-client.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NonMedicalFWAOutcomeDto } from 'src/core/dto/non-medical-fwa-outcome.dto';
import { NonMedicalAdjudicationResult } from './entities/non-medical-adjudication-result.entity';
import { MedicalFWAOutcomeDto } from 'src/core/dto/medical-fwa-outcome.dto';
import { MedicalAdjudicationResult } from './entities/medical-adjudication-result.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PolicyDetailsDto } from './dto/policy-details.dto';
import { MemberDetails } from './entities/member-details.entity';
import { MemberDetailsDto } from './dto/member-details.dto';
import { HospitalDetailsDto } from './dto/hospital-details.dto';
import { PolicyDetails } from './entities/policy-details.entity';

@Injectable()
export class ClaimsAdjudicationService {
  private readonly NON_MEDICAL_FWA_PROCESS_ID = 'nonMedicalFWAProcess';
  private readonly MEDICAL_FWA_PROCESS_ID = 'medicalFWAProcess';
  private readonly MOCK_SERVICE_BASE_URL =
    'https://mock-service-dnhiaxv6nq-el.a.run.app';

  constructor(
    @InjectRepository(AdjudicationItem, 'claims-adjudication')
    private adjudicationItemRepository: Repository<AdjudicationItem>,
    private camundaClientService: CamundaClientService,
    private httpService: HttpService,
  ) {}

  async performNonMedicalFWA(adjudicationItem: AdjudicationItem) {
    const {
      policyNumber,
      insuranceCardNumber,
      hospitalId,
      claimItemTotalAmount,
    } = adjudicationItem;

    // use the policy, hospital and member Id to call APIs of Policy service and get Policy and member level details
    const policyServiceApi = firstValueFrom(
      this.httpService.get(
        `${this.MOCK_SERVICE_BASE_URL}/policy/${policyNumber}`,
      ),
    );
    const hospitalServiceApi = firstValueFrom(
      this.httpService.get(
        `${this.MOCK_SERVICE_BASE_URL}/hospital/${hospitalId}`,
      ),
    );

    const [{ data: policyDetailsData }, { data: hospitalDetailsData }] =
      await Promise.all([policyServiceApi, hospitalServiceApi]);

    const policyDetailsDto: PolicyDetailsDto = policyDetailsData;
    const memberDetailsDto: MemberDetailsDto = policyDetailsDto.members.find(
      (member) => member.id === insuranceCardNumber,
    );
    const hospitalDetailsDto: HospitalDetailsDto = hospitalDetailsData;

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
