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
import { InitiatedClaimEventDto } from 'src/core/dto/initiated-claim-event.dto';
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
import { NonMedicalFWAEventDto } from 'src/core/dto/non-medical-fwa-event.dto';
import { NonMedicalAdjEventDto } from 'src/core/dto/non-medical-adj-event.dto';
import { AdjudicationItemDocument } from './entities/adjudication-item-document.entity';
import { MedicalAdjudicationResultDto } from './dto/medical-adjudication-result.dto';
import { MedicalAdjEventDto } from 'src/core/dto/medical-adj-event.dto';
import { MedicalAdjudicationResult } from './entities/medical-adjudication-result.entity';
import { MedicalFWAEventDto } from 'src/core/dto/medical-fwa-event.dto';

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

  @Post('non-medical-fwa')
  async dummyMethod(@Body() pubSubMessage: PubSubMessageDto) {
    const {
      message: { data },
    } = pubSubMessage;
  }

  @Post('initiated-claims-handler') // initiated-claim-handler
  async initiatedClaimsHandler(@Body() pubSubMessage: PubSubMessageDto) {
    console.log('-------------------  -------------------');
    console.log('initiated claims hanlder invoked...');
    try {
      const {
        message: { data },
      } = pubSubMessage;

      const initiatedClaimItemDto =
        this.pubSubService.formatMessageData<InitiatedClaimEventDto>(
          data,
          InitiatedClaimEventDto,
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
        doctorTreatmentDetails: doctorTreatmentDetailsDto,
        patientAdmissionDetails: patientAdmissionDetailsDto,
        accidentDetails: accidentDetailsDto,
        maternityDetails: maternityDetailsDto,
        documents: documentsDto,
      } = initiatedClaimItemDto;

      // need to convert the array inside from DTO to entity as well
      const { pastHistoryOfChronicIllness: pastHistoryOfChronicIllnessDto } =
        patientAdmissionDetailsDto;
      const pastHistoryOfChronicIllness = pastHistoryOfChronicIllnessDto.map(
        (pastChronicIllness) => new PastChronicIllness(pastChronicIllness),
      );
      const documents = documentsDto.map(
        (adjudicationitemDocument) =>
          new AdjudicationItemDocument(adjudicationitemDocument),
      );

      const doctorTreatmentDetails = new DoctorTreatmentDetails(
        doctorTreatmentDetailsDto,
      );
      const patientAdmissionDetails = new PatientAdmissionDetails({
        ...patientAdmissionDetailsDto,
        pastHistoryOfChronicIllness,
      });
      const accidentDetails = new AccidentDetails(accidentDetailsDto);
      const maternityDetails = new MaternityDetails(maternityDetailsDto);

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
      });

      if (isAccident) {
        adjudicationItem.accidentDetails = accidentDetails;
      }

      if (isPregnancy) {
        adjudicationItem.maternityDetails = maternityDetails;
      }

      // perform non medical FWA
      const { nonMedicalFWAResult, nonMedicalFWAReason, status } =
        await this.claimsAdjudicationService.performNonMedicalFWA(
          adjudicationItem,
        );

      const nonMedicalFwaEvent = new NonMedicalFWAEventDto({
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
        nonMedicalFwaEvent,
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

      await this.claimsAdjudicationService.saveNonMedicalAdjResult(
        claimItemId,
        nonMedicalAdjudicationResult,
      );
      console.log('Non medical adjudication results saved...');

      const nonMedicalAdjEventDto = new NonMedicalAdjEventDto({
        claimItemId,
        overallComment,
      });

      console.log('Publishing to non-medical-adj-completed topic...');
      // Publish to non-medical adjudication completed topic
      await this.pubSubService.publishMessage(
        this.NON_MEDICAL_ADJ_COMPLETED_TOPIC,
        nonMedicalAdjEventDto,
      );
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
  async nonMedicalAdjudicationHandler(@Body() pubSubMessage: PubSubMessageDto) {
    console.log('-------------------  -------------------');
    console.log('medical FWA initiation handler invoked...');
    try {
      const {
        message: { data },
      } = pubSubMessage;

      const nonMedicalAdjEventDto =
        this.pubSubService.formatMessageData<NonMedicalAdjEventDto>(
          data,
          NonMedicalAdjEventDto,
        );

      // perform medical adjudication
      const { claimItemId } = nonMedicalAdjEventDto;

      const { medicalFWAResult, medicalFWAReason, status, claimId } =
        await this.claimsAdjudicationService.performMedicalFWA(claimItemId);

      const medicalFwaEvent = new MedicalFWAEventDto({
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
        medicalFwaEvent,
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

      const { status } = adjudicationItem;

      const medicalAdjEventDto = new MedicalAdjEventDto({
        claimItemId,
        status,
        approvedPayableAmount,
        coPayableAmount,
      });

      console.log('Publishing to medical-adj-completed topic...');
      // Publish to non-medical adjudication completed topic
      await this.pubSubService.publishMessage(
        this.MEDICAL_ADJ_COMPLETED_TOPIC,
        medicalAdjEventDto,
      );
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

  // @Get()
  // findAll() {
  //   // return this.claimsAdjudicationService.findAll();
  // }

  @Get()
  findByClaimitem(@Query('claimItemId') claimItemId: number) {
    return this.claimsAdjudicationService.findOneByClaimItemId(+claimItemId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.claimsAdjudicationService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string) {
    return this.claimsAdjudicationService.update(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.claimsAdjudicationService.remove(+id);
  }
}
