import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  InternalServerErrorException,
  Query,
} from '@nestjs/common';
import { ClaimsAdjudicationService } from './claims-adjudication.service';
import { PubSubMessageDto } from 'src/core/dto/pub-sub-message.dto';
import { PubSubService } from 'src/core/providers/pub-sub/pub-sub.service';
import { ClaimItemInitiatedEventDto } from 'src/core/dto/claim-item-initiated-event.dto';
import {
  AdjudicationItem,
  AdjudicationItemStatus,
} from './entities/adjudication-item.entity';
import { DoctorTreatmentDetails } from './entities/doctor-treatment-details.entity';
import { PatientAdmissionDetails } from './entities/patient-admission-details.entity';
import { AccidentDetails } from './entities/accident-details.entity';
import { MaternityDetails } from './entities/maternity-details.entity';
import { PastChronicIllness } from './entities/past-chronic-illness.entity';
import { NonMedicalAdjudicationResultDto } from './dto/non-medical-adjudication-result.dto';
import { NonMedicalAdjudicationResult } from './entities/non-medical-adjudication-result.entity';
import { VariationData } from './entities/variation-data.entity';
import { NonMedicalFWACompletedEventDto } from 'src/core/dto/non-medical-fwa-completed-event.dto';
import { NonMedicalAdjEventCompletedDto } from 'src/core/dto/non-medical-adj-completed-event.dto';
import { AdjudicationItemDocument } from './entities/adjudication-item-document.entity';
import { MedicalAdjudicationResultDto } from './dto/medical-adjudication-result.dto';
import { MedicalAdjCompletedEventDto } from 'src/core/dto/medical-adj-completed-event.dto';
import { MedicalAdjudicationResult } from './entities/medical-adjudication-result.entity';
import { MedicalFWACompletedEventDto } from 'src/core/dto/medical-fwa-completed-event.dto';
import { PolicyDetails } from './entities/policy-details.entity';
import { MemberDetails } from './entities/member-details.entity';
import { HospitalDetails } from './entities/hospital-details.entity';
import { PasClaimSyncDto } from 'src/claims/dto/pas-claim-sync.dto';
import { InstantCashlessFWACompletedEventDto } from 'src/core/dto/instant-cashless-fwa-completed.dto';

@Controller('claims-adjudication')
export class ClaimsAdjudicationController {
  private readonly NON_MEDICAL_ADJ_COMPLETED_TOPIC =
    'non-medical-adj-completed';
  private readonly NON_MEDICAL_FWA_COMPLETED_TOPIC =
    'non-medical-fwa-completed';
  private readonly MEDICAL_FWA_COMPLETED_TOPIC = 'medical-fwa-completed';
  private readonly MEDICAL_ADJ_COMPLETED_TOPIC = 'medical-adj-completed';
  private readonly PAS_CLAIM_ADJ_SYNC_TOPIC = 'pas-claim-adj-sync';
  private readonly INSTANT_CASHLESS_FWA_COMPLETED_TOPIC =
    'instant-cashless-fwa-completed';

  constructor(
    private readonly claimsAdjudicationService: ClaimsAdjudicationService,
    private pubSubService: PubSubService,
  ) {}

  @Post('claim-initiated-handler')
  async claimInitiatedHandler(@Body() pubSubMessage: PubSubMessageDto) {
    console.log('-------------------  -------------------');
    console.log('Claim initiated hanlder invoked.');
    try {
      const claimItemInitiatedEventDto =
        this.pubSubService.formatMessageData<ClaimItemInitiatedEventDto>(
          pubSubMessage,
          ClaimItemInitiatedEventDto,
        );

      const adjudicationItem = await this.prepareAdjudicationItem(
        claimItemInitiatedEventDto,
      );

      // perform non medical FWA
      const result = await this.claimsAdjudicationService.performNonMedicalFWA(
        adjudicationItem,
      );

      // save adjudication item
      await this.claimsAdjudicationService.saveAdjudicationItem(result);

      const {
        claimId,
        claimItemId,
        nonMedicalFWAResult,
        nonMedicalFWAReason,
        status,
      } = result;

      const nonMedicalFwaCompletedEvent = new NonMedicalFWACompletedEventDto({
        claimId,
        claimItemId,
        nonMedicalFWAReason,
        nonMedicalFWAResult,
        isFailure: status === AdjudicationItemStatus.NON_MEDICAL_FWA_FAILED,
      });

      // Publish to non-medical FWA completed topic
      console.log('Publishing to non-medical-fwa-completed topic.');
      await this.pubSubService.publishMessage(
        this.NON_MEDICAL_FWA_COMPLETED_TOPIC,
        nonMedicalFwaCompletedEvent,
      );

      //Sync to PAS
      await this.syncToPas(claimId);
    } catch (error) {
      console.log(
        `Error occured while handling initiated-claims event ! Error: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Error occured while handling initiated-claims event!',
        {
          cause: error,
          description: error.message,
        },
      );
    }
  }

  @Post('instant-cashless-claim-initiated-handler')
  async instantCashlessClaimInitiatedHandler(
    @Body() pubSubMessage: PubSubMessageDto,
  ) {
    console.log('-------------------  -------------------');
    console.log('Instant cashless claim initiated hanlder invoked.');
    try {
      const claimItemInitiatedEventDto =
        this.pubSubService.formatMessageData<ClaimItemInitiatedEventDto>(
          pubSubMessage,
          ClaimItemInitiatedEventDto,
        );

      const adjudicationItem = await this.prepareAdjudicationItem(
        claimItemInitiatedEventDto,
      );

      if (
        adjudicationItem.nonMedicalFWAResult &&
        adjudicationItem.medicalFWAResult
      ) {
        console.log(
          `Non medical and medical FWA already performed for adjudicationItem ID: ${adjudicationItem.id}`,
        );
        return;
      }

      // perform non medical FWA
      const nonMedicalFWAPromise =
        this.claimsAdjudicationService.performNonMedicalFWA(adjudicationItem);

      const medicalFWAPromise =
        this.claimsAdjudicationService.performMedicalFWA(adjudicationItem);

      await Promise.all([nonMedicalFWAPromise, medicalFWAPromise]);

      // save after performing both checks
      await this.claimsAdjudicationService.saveAdjudicationItem(
        adjudicationItem,
      );

      const {
        nonMedicalFWAResult,
        nonMedicalFWAReason,
        medicalFWAReason,
        medicalFWAResult,
        claimId,
        claimItemId,
      } = adjudicationItem;

      const instantCashlessFWACompletedEventDto =
        new InstantCashlessFWACompletedEventDto({
          claimId,
          claimItemId,
          nonMedicalFWAReason,
          nonMedicalFWAResult,
          medicalFWAReason,
          medicalFWAResult,
        });

      // publish to instant-cashless-fwa-completed topic
      console.log('Publishing to instant-cashless-fwa-completed topic.');
      await this.pubSubService.publishMessage(
        this.INSTANT_CASHLESS_FWA_COMPLETED_TOPIC,
        instantCashlessFWACompletedEventDto,
      );

      // sync to PAS
      await this.syncToPas(claimId);
    } catch (error) {
      console.log(
        `Error occured while handling instant-cashless-claim-initiated event ! Error: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Error occured while handling instant-cashless-claim-initiated event!',
        {
          cause: error,
          description: error.message,
        },
      );
    }
  }

  @Post('non-medical-adjudication')
  async saveNonMedicalAdjudicationResult(
    @Body() nonMedicalAdjudicationResultDto: NonMedicalAdjudicationResultDto,
  ) {
    console.log('-------------------  -------------------');
    console.log('Non medical adj API called !');
    try {
      const {
        variations: variationsDto,
        claimItemId,
        overallComment,
      } = nonMedicalAdjudicationResultDto;

      const nonMedicalAdjudicationResult = new NonMedicalAdjudicationResult({
        overallComment,
      });

      if (variationsDto && variationsDto.length) {
        variationsDto.forEach((variationDto) => {
          const { fieldName, comment } = variationDto;

          const variationData = new VariationData({
            comment,
            fieldName,
          });

          nonMedicalAdjudicationResult.addVariationData(variationData);
        });
      }

      const adjudicationItem =
        await this.claimsAdjudicationService.saveNonMedicalAdjResult(
          claimItemId,
          nonMedicalAdjudicationResult,
        );

      const nonMedicalAdjEventCompletedDto = new NonMedicalAdjEventCompletedDto(
        {
          claimItemId,
          overallComment,
        },
      );

      // Publish to non-medical adjudication completed topic
      console.log('Publishing to non-medical-adj-completed topic.');
      await this.pubSubService.publishMessage(
        this.NON_MEDICAL_ADJ_COMPLETED_TOPIC,
        nonMedicalAdjEventCompletedDto,
      );

      //Sync to PAS
      const { claimId } = adjudicationItem;
      await this.syncToPas(claimId);

      return adjudicationItem;
    } catch (error) {
      console.log(
        `Error occured while saving non medical adjudication result ! Error: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Error occured while saving non medical adjudication result!',
        {
          cause: error,
          description: error.message,
        },
      );
    }
  }

  @Post('non-medical-adj-handler')
  async nonMedicalAdjudicationCompletedHandler(
    @Body() pubSubMessage: PubSubMessageDto,
  ) {
    console.log('-------------------  -------------------');
    console.log('medical FWA initiation handler invoked...');
    try {
      const nonMedicalAdjCompletedEventDto =
        this.pubSubService.formatMessageData<NonMedicalAdjEventCompletedDto>(
          pubSubMessage,
          NonMedicalAdjEventCompletedDto,
        );

      // perform medical adjudication
      const { claimItemId } = nonMedicalAdjCompletedEventDto;

      const adjudicationItem =
        await this.claimsAdjudicationService.findAdjudicationItemByClaimItemId(
          claimItemId,
        );

      const result = await this.claimsAdjudicationService.performMedicalFWA(
        adjudicationItem,
      );

      // save adjudication item
      await this.claimsAdjudicationService.saveAdjudicationItem(result);

      const { medicalFWAResult, medicalFWAReason, status, claimId } = result;

      const medicalFwaCompletedEvent = new MedicalFWACompletedEventDto({
        claimId,
        claimItemId,
        medicalFWAResult,
        medicalFWAReason,
        isFailure: status === AdjudicationItemStatus.MEDICAL_FWA_FAILED,
      });

      // Publish to non-medical FWA completed topic
      console.log('Publishing to medical-fwa-completed topic.');
      await this.pubSubService.publishMessage(
        this.MEDICAL_FWA_COMPLETED_TOPIC,
        medicalFwaCompletedEvent,
      );

      //Sync to PAS
      await this.syncToPas(claimId);
    } catch (error) {
      console.log(
        `Error occured while initiating medical FWA ! Error: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Error occured while initiating medical FWA !',
        {
          cause: error,
          description: error.message,
        },
      );
    }
  }

  @Post('medical-adjudication')
  async saveMedicalAdjudicationResult(
    @Body() medicalAdjudicationResultDto: MedicalAdjudicationResultDto,
  ) {
    console.log('-------------------  -------------------');
    console.log('Medical adj API called !');
    try {
      const {
        claimItemId,
        approvedPayableAmount,
        coPayableAmount,
        decision,
        overallComment,
        // variations: variationsDto,
      } = medicalAdjudicationResultDto;

      const medicalAdjudicationResult = new MedicalAdjudicationResult({
        decision,
        approvedPayableAmount,
        coPayableAmount,
        overallComment,
      });

      // if (variationsDto && variationsDto.length) {
      //   variationsDto.forEach((variationDto) => {
      //     const { fieldName, comment } = variationDto;

      //     const variationData = new VariationData({
      //       comment,
      //       fieldName,
      //     });

      //     medicalAdjudicationResult.addVariationData(variationData);
      //   });
      // }

      const adjudicationItem =
        await this.claimsAdjudicationService.saveMedicalAdjResult(
          claimItemId,
          medicalAdjudicationResult,
        );

      const { status, claimId } = adjudicationItem;

      const medicalAdjCompletedEventDto = new MedicalAdjCompletedEventDto({
        claimId,
        claimItemId,
        status,
        approvedPayableAmount,
        coPayableAmount,
        overallComment,
      });

      // publish to medical adjudication completed topic
      console.log('Publishing to medical-adj-completed topic.');
      await this.pubSubService.publishMessage(
        this.MEDICAL_ADJ_COMPLETED_TOPIC,
        medicalAdjCompletedEventDto,
      );

      // sync to PAS
      await this.syncToPas(claimId);

      return adjudicationItem;
    } catch (error) {
      console.log(
        `Error occured while saving medical adjudication result ! Error: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Error occured while saving medical adjudication result!',
        {
          cause: error,
          description: error.message,
        },
      );
    }
  }

  @Get()
  findByClaimitem(@Query('claimItemId') claimItemId: number) {
    return this.claimsAdjudicationService.findAdjudicationItemByClaimItemId(
      claimItemId,
    );
  }

  @Get('claim/:claimId')
  findAllByClaimId(@Param('claimId') claimId: number) {
    return this.claimsAdjudicationService.findAdjudicationItemsByClaimId(
      claimId,
    );
  }

  @Get('non-medical-adjudication')
  getNonMedicalAdjudicationItems() {
    try {
      return this.claimsAdjudicationService.getNonMedicalAdjudicationItems();
    } catch (error) {
      console.log(
        `Error occured while fethcing non medical adjudication items ! Error: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Error occured while fethcing non medical adjudication items !',
        {
          cause: error,
          description: error.message,
        },
      );
    }
  }

  @Get('medical-adjudication')
  getMedicalAdjudicationItems() {
    try {
      return this.claimsAdjudicationService.getMedicalAdjudicationItems();
    } catch (error) {
      console.log(
        `Error occured while fetching medical adjudication items ! Error: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Error occured while fetching medical adjudication items !',
        {
          cause: error,
          description: error.message,
        },
      );
    }
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.claimsAdjudicationService.findAdjudicationItem(id);
  }

  async prepareAdjudicationItem(
    claimItemInitiatedEventDto: ClaimItemInitiatedEventDto,
  ) {
    const {
      policyNumber,
      insuranceCardNumber,
      hospitalId,
      claimId,
      claimType,
      totalClaimAmount,
      approvedPayableAmount,
      coPayableAmount,
      tpaId,
      isAccident,
      isPregnancy,
      claimItemId,
      claimItemTotalAmount,
      claimItemType,
      policyDetails: eventPolicyDetails,
      hospitalDetails: eventHospitalDetails,
      memberDetails: eventMemberDetails,
      doctorTreatmentDetails: doctorTreatmentDetailsDto,
      patientAdmissionDetails: patientAdmissionDetailsDto,
      accidentDetails: accidentDetailsDto,
      maternityDetails: maternityDetailsDto,
      documents: documentsDto,
      isInstantCashless,
    } = claimItemInitiatedEventDto;

    let documents: AdjudicationItemDocument[],
      patientAdmissionDetails: PatientAdmissionDetails,
      doctorTreatmentDetails: DoctorTreatmentDetails,
      accidentDetails: AccidentDetails,
      maternityDetails: MaternityDetails,
      policyDetails: PolicyDetails,
      memberDetails: MemberDetails,
      hospitalDetails: HospitalDetails;

    // check if an adjudication item already exists for the same claim
    const existingAdjudicationItems =
      await this.claimsAdjudicationService.findAdjudicationItemsByClaimId(
        claimId,
      );
    const existingAdjudicationItem = existingAdjudicationItems[0];

    if (existingAdjudicationItem) {
      console.log(
        'Reusing existing database references for claim related details.',
      );
      patientAdmissionDetails =
        existingAdjudicationItem.patientAdmissionDetails;
      documents = existingAdjudicationItem.documents;
      doctorTreatmentDetails = existingAdjudicationItem.doctorTreatmentDetails;
      accidentDetails = existingAdjudicationItem.accidentDetails;
      maternityDetails = existingAdjudicationItem.maternityDetails;
      policyDetails = existingAdjudicationItem.policyDetails;
      memberDetails = existingAdjudicationItem.memberDetails;
      hospitalDetails = existingAdjudicationItem.hospitalDetails;
    } else {
      // need to convert the array inside from DTO to entity as well
      const { pastHistoryOfChronicIllness: pastHistoryOfChronicIllnessDto } =
        patientAdmissionDetailsDto;
      const pastHistoryOfChronicIllness = pastHistoryOfChronicIllnessDto.map(
        (pastChronicIllness) => new PastChronicIllness(pastChronicIllness),
      );

      patientAdmissionDetails = new PatientAdmissionDetails({
        ...patientAdmissionDetailsDto,
        pastHistoryOfChronicIllness,
      });
      documents = documentsDto.map(
        (adjudicationItemDocument) =>
          new AdjudicationItemDocument(adjudicationItemDocument),
      );
      doctorTreatmentDetails = new DoctorTreatmentDetails(
        doctorTreatmentDetailsDto,
      );
      accidentDetails = new AccidentDetails(accidentDetailsDto);
      maternityDetails = new MaternityDetails(maternityDetailsDto);
      policyDetails = new PolicyDetails(eventPolicyDetails);
      memberDetails = new MemberDetails(eventMemberDetails);
      hospitalDetails = new HospitalDetails(eventHospitalDetails);
    }

    const adjudicationItem = new AdjudicationItem({
      claimId,
      policyNumber,
      insuranceCardNumber,
      hospitalId,
      claimType,
      totalClaimAmount,
      totalApprovedPayableAmount: approvedPayableAmount,
      totalCoPayableAmount: coPayableAmount,
      tpaId,
      isAccident,
      isPregnancy,
      claimItemId,
      claimItemTotalAmount,
      claimItemType,
      doctorTreatmentDetails,
      patientAdmissionDetails,
      documents,
      policyDetails,
      memberDetails,
      hospitalDetails,
      isInstantCashless,
    });

    if (isAccident) {
      adjudicationItem.accidentDetails = accidentDetails;
    }

    if (isPregnancy) {
      adjudicationItem.maternityDetails = maternityDetails;
    }

    return adjudicationItem;
  }

  async syncToPas(claimId: number) {
    console.log('Syncing to PAS claims adj topic.');

    const pasClaimSyncDto = new PasClaimSyncDto(claimId);
    await this.pubSubService.publishMessage(
      this.PAS_CLAIM_ADJ_SYNC_TOPIC,
      pasClaimSyncDto,
    );
  }
}
