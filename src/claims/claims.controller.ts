import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  InternalServerErrorException,
} from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { AccidentDetails } from './entities/accident-details.entity';
import { MaternityDetails } from './entities/maternity-details.entity';
import { PatientAdmissionDetails } from './entities/patient-admission-details.entity';
import { DoctorTreatmentDetails } from './entities/doctor-treatment-details.entity';
import { TpaHospitalDetails } from './entities/tpa-hospital-details.entity';
import { PatientDeclaration } from './entities/patient-declaration.entity';
import { HospitalDeclaration } from './entities/hospital-declaration.entity';
import { Claim } from './entities/claim.entity';
import { DoctorDeclaration } from './entities/doctor-declaration.entity';
import { TpaPolicyDetails } from './entities/tpa-policy-details.entity';
import { TpaMemberDetails } from './entities/tpa-member-details.entity';
import { PastChronicIllness } from './entities/past-chronic-illness.entity';
import { PubSubService } from 'src/core/providers/pub-sub/pub-sub.service';
import { PubSubMessageDto } from 'src/core/dto/pub-sub-message.dto';
import { NonMedicalFWAEventDto } from 'src/core/dto/non-medical-fwa-event.dto';
import { NonMedicalAdjEventDto } from 'src/core/dto/non-medical-adj-event.dto';
import { InitiatedClaimEventDto } from 'src/core/dto/initiated-claim-event.dto';
import { MedicalAdjEventDto } from 'src/core/dto/medical-adj-event.dto';
import { MedicalFWAEventDto } from 'src/core/dto/medical-fwa-event.dto';

@Controller('claims')
export class ClaimsController {
  readonly INITIATED_CLAIMS_TOPIC = 'initiated-claims';

  constructor(
    private readonly claimsService: ClaimsService,
    private pubSubService: PubSubService,
  ) {}

  @Post()
  async create(@Body() createClaimDto: CreateClaimDto) {
    try {
      const {
        tpaId,
        claimType,
        insuranceCardNumber,
        policyNumber,
        hospitalId,
        totalClaimAmount,
        accidentDetails: accidentDetailsDto,
        maternityDetails: maternityDetailsDto,
        patientAdmissionDetails: patientAdmissionDetailsDto,
        doctorTreatmentDetails: doctorTreatmentDetailsDto,
        patientDeclaration: patientDeclarationDto,
        doctorDeclaration: doctorDeclarationDto,
        hospitalDeclaration: hospitalDeclarationDto,
        hospitalDetails: tpaHospitalDetailsDto,
        policyDetails: tpaPolicyDetailsDto,
        memberDetails: tpaMemberDetailsDto,
      } = createClaimDto;

      // need to convert the array inside from DTO to entity as well
      const { pastHistoryOfChronicIllness: pastHistoryOfChronicIllnessDto } =
        patientAdmissionDetailsDto;
      const pastHistoryOfChronicIllness = pastHistoryOfChronicIllnessDto.map(
        (pastChronicIllness) => new PastChronicIllness(pastChronicIllness),
      );

      const patientAdmissionDetails = new PatientAdmissionDetails({
          ...patientAdmissionDetailsDto,
          pastHistoryOfChronicIllness,
        }),
        doctorTreatmentDetails = new DoctorTreatmentDetails(
          doctorTreatmentDetailsDto,
        ),
        tpaPolicyDetails = new TpaPolicyDetails(tpaPolicyDetailsDto),
        tpaMemberDetails = new TpaMemberDetails(tpaMemberDetailsDto),
        tpaHospitalDetails = new TpaHospitalDetails(tpaHospitalDetailsDto),
        patientDeclaration = new PatientDeclaration(patientDeclarationDto),
        doctorDeclaration = new DoctorDeclaration(doctorDeclarationDto),
        hospitalDeclaration = new HospitalDeclaration(hospitalDeclarationDto);

      const claim = new Claim({
        tpaId,
        claimType,
        insuranceCardNumber,
        policyNumber,
        hospitalId,
        totalClaimAmount,
        patientAdmissionDetails,
        doctorTreatmentDetails,
        tpaPolicyDetails,
        tpaMemberDetails,
        tpaHospitalDetails,
        patientDeclaration,
        doctorDeclaration,
        hospitalDeclaration,
      });

      let accidentDetails: AccidentDetails, maternityDetails: MaternityDetails;

      if (accidentDetailsDto) {
        accidentDetails = new AccidentDetails(accidentDetailsDto);
        claim.isAccident = true;
        claim.accidentDetails = accidentDetails;
      }
      if (maternityDetailsDto) {
        maternityDetails = new MaternityDetails(maternityDetailsDto);
        claim.isPregnancy = true;
        claim.maternityDetails = maternityDetails;
      }

      // save new claim
      const initiatedClaim = await this.claimsService.initiateClaim(claim);
      console.log('New claim request saved...');

      return initiatedClaim;
    } catch (error) {
      throw new InternalServerErrorException('Failed to initiate claim !', {
        cause: error,
        description: error.message,
      });
    }
  }

  @Post('fileUpload/:claimItemId')
  @UseInterceptors(AnyFilesInterceptor())
  async fileUpload(
    @Param('claimItemId') claimItemId: number,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    try {
      // save document against claimItem
      console.log('Upload document API called!');
      console.log('Saving documents...');
      await this.claimsService.processDocumentUpload(claimItemId, files);

      const initiatedClaimEventDto = await this.prepareInitiatedClaimEventDto(
        claimItemId,
      );

      console.log('Publishing to initiated-claims topic ...');
      // Publish to initiated topic
      await this.pubSubService.publishMessage(
        this.INITIATED_CLAIMS_TOPIC,
        initiatedClaimEventDto,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Error occured during fileUpload or publishing event!',
        {
          cause: error,
          description: error.message,
        },
      );
    }
  }

  @Post('non-medical-fwa-handler')
  async nonMedicalFWAHandler(@Body() pubSubMessage: PubSubMessageDto) {
    console.log('-------------------  -------------------');
    console.log('Non medical FWA hanlder invoked...');
    try {
      const {
        message: { data },
      } = pubSubMessage;

      const nonMedicalFWAEventDto =
        this.pubSubService.formatMessageData<NonMedicalFWAEventDto>(
          data,
          NonMedicalFWAEventDto,
        );

      await this.claimsService.updateNonMedicalFWAResults(
        nonMedicalFWAEventDto,
      );
      console.log(
        'claim and claimItem status updated with non medical fwa event ...',
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Error occured while handling non-medical-fwa-completed event!',
        {
          cause: error,
          description: error.message,
        },
      );
    }
  }

  @Post('non-medical-adj-handler')
  async nonMedicalAdjHandler(@Body() pubSubMessage: PubSubMessageDto) {
    console.log('-------------------  -------------------');
    console.log('Non medical adj hanlder invoked...');
    try {
      const {
        message: { data },
      } = pubSubMessage;

      const nonMedicalAdjEventDto =
        this.pubSubService.formatMessageData<NonMedicalAdjEventDto>(
          data,
          NonMedicalAdjEventDto,
        );

      await this.claimsService.updateNonMedicalAdjesults(nonMedicalAdjEventDto);
      console.log(
        'claim and claimItem status updated with non medical adj event ...',
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Error occured while handling non-medical-adj-completed event!',
        {
          cause: error,
          description: error.message,
        },
      );
    }
  }

  @Post('medical-fwa-handler')
  async medicalFWAHandler(@Body() pubSubMessage: PubSubMessageDto) {
    console.log('-------------------  -------------------');
    console.log('Medical FWA hanlder invoked...');
    try {
      const {
        message: { data },
      } = pubSubMessage;

      const medicalFWAEventDto =
        this.pubSubService.formatMessageData<MedicalFWAEventDto>(
          data,
          MedicalFWAEventDto,
        );

      await this.claimsService.updateMedicalFWAResults(medicalFWAEventDto);
      console.log('claimItem status updated with medical fwa event ...');
    } catch (error) {
      throw new InternalServerErrorException(
        'Error occured while handling medical-fwa-completed event!',
        {
          cause: error,
          description: error.message,
        },
      );
    }
  }

  @Post('medical-adj-handler')
  async medicalAdjHandler(@Body() pubSubMessage: PubSubMessageDto) {
    console.log('-------------------  -------------------');
    console.log('Medical adj hanlder invoked...');
    try {
      const {
        message: { data },
      } = pubSubMessage;

      const medicalAdjEventDto =
        this.pubSubService.formatMessageData<MedicalAdjEventDto>(
          data,
          MedicalAdjEventDto,
        );

      await this.claimsService.updateMedicalAdjResults(medicalAdjEventDto);
      console.log(
        'claim and claimItem status updated with medical adj event ...',
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Error occured while handling non-medical-adj-completed event!',
        {
          cause: error,
          description: error.message,
        },
      );
    }
  }

  @Post('create-topic')
  async createTopic(@Body('topicName') topicName) {
    return await this.pubSubService.createTopic(topicName);
  }

  @Post('create-subscription')
  async createSubscription(
    @Body('topicName') topicName: string,
    @Body('subscriptionName') subscriptionName: string,
    @Body('endpoint') endpoint: string,
  ) {
    return await this.pubSubService.createSubscription(
      topicName,
      subscriptionName,
      endpoint,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.claimsService.findClaim(id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateClaimDto: UpdateClaimDto) {
  //   return this.claimsService.update(+id, updateClaimDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.claimsService.remove(+id);
  }

  async prepareInitiatedClaimEventDto(claimItemId: number) {
    const claimItem = await this.claimsService.findClaimItem(claimItemId);

    const {
      totalAmount: claimItemTotalAmount,
      claimItemType,
      documents,
      claim: {
        id: claimId,
        policyNumber,
        insuranceCardNumber,
        tpaId,
        totalClaimAmount,
        hospitalId,
        accidentDetails,
        maternityDetails,
        doctorTreatmentDetails,
        patientAdmissionDetails,
        claimType,
        isAccident,
        isPregnancy,
      },
    } = claimItem;

    // Including only claim related data. Redundant TPA data is not included.
    const initiatedClaimItemDto = new InitiatedClaimEventDto({
      claimId,
      policyNumber,
      insuranceCardNumber,
      tpaId,
      hospitalId,
      totalClaimAmount,
      claimType,
      claimItemId,
      claimItemTotalAmount,
      claimItemType,
      isAccident,
      isPregnancy,
      patientAdmissionDetails,
      doctorTreatmentDetails,
      documents,
    });

    if (isAccident) {
      initiatedClaimItemDto.accidentDetails = accidentDetails;
    }

    if (isPregnancy) {
      initiatedClaimItemDto.maternityDetails = maternityDetails;
    }

    return initiatedClaimItemDto;
  }
}
