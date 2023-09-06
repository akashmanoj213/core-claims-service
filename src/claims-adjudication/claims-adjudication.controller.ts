import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  InternalServerErrorException,
  Query,
} from '@nestjs/common';
import { ClaimsAdjudicationService } from './claims-adjudication.service';
import { PubSubMessageDto } from 'src/core/dto/pub-sub-message.dto';
import { PubSubService } from 'src/core/providers/pub-sub/pub-sub.service';
import { ClaimInitiatedEventDto } from 'src/core/dto/claim-initiated-event.dto';
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

@Controller('claims-adjudication')
export class ClaimsAdjudicationController {
  readonly NON_MEDICAL_FWA_COMPLETED_TOPIC = 'non-medical-fwa-completed';
  readonly NON_MEDICAL_ADJ_COMPLETED_TOPIC = 'non-medical-adj-completed';
  readonly MEDICAL_FWA_COMPLETED_TOPIC = 'medical-fwa-completed';
  readonly MEDICAL_ADJ_COMPLETED_TOPIC = 'medical-adj-completed';

  constructor(
    private readonly claimsAdjudicationService: ClaimsAdjudicationService,
    private pubSubService: PubSubService,
  ) {}

  @Post('claim-initiated-handler')
  async claimInitiatedHandler(@Body() pubSubMessage: PubSubMessageDto) {
    console.log('-------------------  -------------------');
    console.log('initiated claims hanlder invoked...');
    try {
      const {
        message: { data },
      } = pubSubMessage;

      const claimInitiatedEventDto =
        this.pubSubService.formatMessageData<ClaimInitiatedEventDto>(
          data,
          ClaimInitiatedEventDto,
        );

      const {
        policyNumber,
        insuranceCardNumber,
        hospitalId,
        claimId,
        claimType,
        totalClaimAmount,
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
      } = claimInitiatedEventDto;

      let documents: AdjudicationItemDocument[],
        patientAdmissionDetails: PatientAdmissionDetails,
        doctorTreatmentDetails: DoctorTreatmentDetails,
        accidentDetails: AccidentDetails,
        maternityDetails: MaternityDetails,
        policyDetails: PolicyDetails,
        memberDetails: MemberDetails,
        hospitalDetails: HospitalDetails;

      //check if an adjudication item already exists for the same claim
      const existingAdjudicationItem =
        await this.claimsAdjudicationService.findAdjudicationItemByClaimId(
          claimId,
        );

      if (existingAdjudicationItem) {
        console.log('Using existing database references...');
        documents = existingAdjudicationItem.documents;
        patientAdmissionDetails =
          existingAdjudicationItem.patientAdmissionDetails;
        doctorTreatmentDetails =
          existingAdjudicationItem.doctorTreatmentDetails;
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

        documents = documentsDto.map(
          (adjudicationItemDocument) =>
            new AdjudicationItemDocument(adjudicationItemDocument),
        );

        patientAdmissionDetails = new PatientAdmissionDetails({
          ...patientAdmissionDetailsDto,
          pastHistoryOfChronicIllness,
        });

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
      });

      if (isAccident) {
        adjudicationItem.accidentDetails = accidentDetails;
      }

      if (isPregnancy) {
        adjudicationItem.maternityDetails = maternityDetails;
      }

      // perform non medical FWA
      const result = await this.claimsAdjudicationService.performNonMedicalFWA(
        adjudicationItem,
      );

      await this.claimsAdjudicationService.saveAdjudicationItem(result);

      const { nonMedicalFWAResult, nonMedicalFWAReason, status } = result;

      const nonMedicalFwaCompletedEvent = new NonMedicalFWACompletedEventDto({
        claimId,
        claimItemId,
        nonMedicalFWAReason,
        nonMedicalFWAResult,
        isFailure: status === AdjudicationItemStatus.NON_MEDICAL_FWA_FAILED,
      });

      console.log('Publishing to non-medical-fwa-completed topic ...');
      // Publish to non-medical FWA completed topic
      await this.pubSubService.publishMessage(
        this.NON_MEDICAL_FWA_COMPLETED_TOPIC,
        nonMedicalFwaCompletedEvent,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Error occured while handling initiated-claims event!',
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
    console.log('Save non medical adj API called !');
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
      console.log('Non medical adjudication results saved...');

      const nonMedicalAdjEventCompletedDto = new NonMedicalAdjEventCompletedDto(
        {
          claimItemId,
          overallComment,
        },
      );

      console.log('Publishing to non-medical-adj-completed topic...');
      // Publish to non-medical adjudication completed topic
      await this.pubSubService.publishMessage(
        this.NON_MEDICAL_ADJ_COMPLETED_TOPIC,
        nonMedicalAdjEventCompletedDto,
      );

      return adjudicationItem;
    } catch (error) {
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
      const {
        message: { data },
      } = pubSubMessage;

      const nonMedicalAdjCompletedEventDto =
        this.pubSubService.formatMessageData<NonMedicalAdjEventCompletedDto>(
          data,
          NonMedicalAdjEventCompletedDto,
        );

      // perform medical adjudication
      const { claimItemId } = nonMedicalAdjCompletedEventDto;

      const { medicalFWAResult, medicalFWAReason, status, claimId } =
        await this.claimsAdjudicationService.performMedicalFWA(claimItemId);

      const medicalFwaCompletedEvent = new MedicalFWACompletedEventDto({
        claimId,
        claimItemId,
        medicalFWAResult,
        medicalFWAReason,
        isFailure: status === AdjudicationItemStatus.MEDICAL_FWA_FAILED,
      });

      console.log('Publishing to medical-fwa-completed topic ...');
      // Publish to non-medical FWA completed topic
      await this.pubSubService.publishMessage(
        this.MEDICAL_FWA_COMPLETED_TOPIC,
        medicalFwaCompletedEvent,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Error occured while initiating medical FWA!',
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
    console.log('Save medical adj API called !');
    try {
      const {
        claimItemId,
        approvedPayableAmount,
        coPayableAmount,
        decision,
        variations: variationsDto,
      } = medicalAdjudicationResultDto;

      const medicalAdjudicationResult = new MedicalAdjudicationResult({
        decision,
        approvedPayableAmount,
        coPayableAmount,
      });

      if (variationsDto && variationsDto.length) {
        variationsDto.forEach((variationDto) => {
          const { fieldName, comment } = variationDto;

          const variationData = new VariationData({
            comment,
            fieldName,
          });

          medicalAdjudicationResult.addVariationData(variationData);
        });
      }

      const adjudicationItem =
        await this.claimsAdjudicationService.saveMedicalAdjResult(
          claimItemId,
          medicalAdjudicationResult,
        );
      console.log('Medical adjudication results saved...');

      const { status, claimId } = adjudicationItem;

      const medicalAdjCompletedEventDto = new MedicalAdjCompletedEventDto({
        claimId,
        claimItemId,
        status,
        approvedPayableAmount,
        coPayableAmount,
      });

      console.log('Publishing to medical-adj-completed topic...');
      // Publish to non-medical adjudication completed topic
      await this.pubSubService.publishMessage(
        this.MEDICAL_ADJ_COMPLETED_TOPIC,
        medicalAdjCompletedEventDto,
      );

      return adjudicationItem;
    } catch (error) {
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
      +claimItemId,
    );
  }

  @Get('non-medical-adjudication')
  getNonMedicalAdjudicationItems() {
    try {
      return this.claimsAdjudicationService.getNonMedicalAdjudicationItems();
    } catch (error) {
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
      throw new InternalServerErrorException(
        'Error occured while fethcing medical adjudication items !',
        {
          cause: error,
          description: error.message,
        },
      );
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.claimsAdjudicationService.findAdjudicationItem(+id);
  }
}
