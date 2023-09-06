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
import { Claim, ClaimStatus } from './entities/claim.entity';
import { DoctorDeclaration } from './entities/doctor-declaration.entity';
import { TpaPolicyDetails } from './entities/tpa-policy-details.entity';
import { TpaMemberDetails } from './entities/tpa-member-details.entity';
import { PastChronicIllness } from './entities/past-chronic-illness.entity';
import { PubSubService } from 'src/core/providers/pub-sub/pub-sub.service';
import { PubSubMessageDto } from 'src/core/dto/pub-sub-message.dto';
import { NonMedicalFWACompletedEventDto } from 'src/core/dto/non-medical-fwa-completed-event.dto';
import { NonMedicalAdjEventCompletedDto } from 'src/core/dto/non-medical-adj-completed-event.dto';
import { ClaimItemInitiatedEventDto } from 'src/core/dto/claim-item-initiated-event.dto';
import { MedicalAdjCompletedEventDto } from 'src/core/dto/medical-adj-completed-event.dto';
import { MedicalFWACompletedEventDto } from 'src/core/dto/medical-fwa-completed-event.dto';
import { ClaimItem } from './entities/claim-item.entity';
import { NotificationService } from 'src/core/providers/notification/notification.service';
import { CreateEnhancementDto } from './dto/create-enhancement.dto';
import { CreateFinalSubmissionDto } from './dto/create-final-submission.dto';
import { ClaimApprovedEventDto } from 'src/core/dto/claim-approved-event.dto';
import { PaymentStatusChangedEventDto } from 'src/core/dto/payment-status-changed-event.dto';

@Controller('claims')
export class ClaimsController {
  private readonly CLAIM_INITIATED_TOPIC = 'claim-initiated';
  private readonly CLAIM_APPROVED_TOPIC = 'claim-approved';
  private readonly CLAIM_REJECTED_TOPIC = 'claim-rejected';

  constructor(
    private readonly claimsService: ClaimsService,
    private pubSubService: PubSubService,
    private notificationService: NotificationService,
  ) {}

  @Post()
  async create(@Body() createClaimDto: CreateClaimDto) {
    try {
      console.log('Create claim API invoked...');

      const {
        tpaId,
        claimType,
        insuranceCardNumber,
        policyNumber,
        hospitalId,
        // totalClaimAmount,
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
        hospitalDeclaration = new HospitalDeclaration(hospitalDeclarationDto),
        contactNumber = patientAdmissionDetailsDto.contactNumber;

      const claim = new Claim({
        tpaId,
        claimType,
        insuranceCardNumber,
        policyNumber,
        hospitalId,
        contactNumber,
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

      //initiate new claim and check variations
      const initiatedClaim = await this.claimsService.initiateAndVerifyClaim(
        claim,
      );

      // save new claim
      const savedClaim = await this.claimsService.saveClaim(initiatedClaim);
      console.log('New claim request saved...');

      console.log('Sending SMS to customer...');
      await this.notificationService.sendSMS(
        contactNumber,
        `A new claim with claim ID : ${savedClaim.id} has been initiated and will be reviewed shortly...`,
      );

      return savedClaim;
    } catch (error) {
      throw new InternalServerErrorException('Failed to initiate claim !', {
        cause: error,
        description: error.message,
      });
    }
  }

  @Post('/:claimId/enhancement')
  async addEnhancement(
    @Param('claimId') claimId: number,
    @Body() createEnhancementDto: CreateEnhancementDto,
  ) {
    try {
      console.log('addEnhancement API invoked...');
      const { enhancementAmount } = createEnhancementDto;

      const claim = await this.claimsService.createEnhancement(
        claimId,
        enhancementAmount,
      );

      const savedClaim = await this.claimsService.saveClaim(claim);

      const { contactNumber, claimItems } = savedClaim;

      const enhancementClaimItem = claimItems.sort((a, b) => b.id - a.id)[0];

      console.log(
        `New enhancement claim item with id: ${enhancementClaimItem.id} created...`,
      );

      console.log('Sending SMS to customer...');
      await this.notificationService.sendSMS(
        contactNumber,
        `An enhancement request has been placed for your claim id: ${claimId} and will be reviewed shortly...`,
      );

      return enhancementClaimItem;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create enhancement claim item !',
        {
          cause: error,
          description: error.message,
        },
      );
    }
  }

  @Post('/:claimId/final-submission')
  async addFinalSubmission(
    @Param('claimId') claimId: number,
    @Body() createFinalSubmissionDto: CreateFinalSubmissionDto,
  ) {
    try {
      console.log('addFinalSubmission API invoked...');
      const { remainingAmount } = createFinalSubmissionDto;

      const claim = await this.claimsService.createFinalSubmission(
        claimId,
        remainingAmount,
      );

      const savedClaim = await this.claimsService.saveClaim(claim);

      const { contactNumber, claimItems } = savedClaim;

      const finalClaimItem = claimItems.sort((a, b) => b.id - a.id)[0];

      console.log(
        `Final submission claim item with id: ${finalClaimItem.id} created...`,
      );

      console.log('Sending SMS to customer...');
      await this.notificationService.sendSMS(
        contactNumber,
        `A final discharge request has been placed for your claim id: ${claimId} and will be reviewed shortly...`,
      );

      return finalClaimItem;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create final submission claim item !',
        {
          cause: error,
          description: error.message,
        },
      );
    }
  }

  @Post('claim-item/:claimItemId/file-upload')
  @UseInterceptors(AnyFilesInterceptor())
  async fileUpload(
    @Param('claimItemId') claimItemId: number,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    try {
      console.log('fileUpload API invoked...');

      const fieldNames = [];

      files.forEach((file) => {
        fieldNames.push(file.fieldname);
      });

      // validate document list
      this.validateDocumentsList(fieldNames);

      const documentRespondePromise =
        this.claimsService.processDocumentUploads(files);
      const claimItemPromise = this.claimsService.findClaimItem(claimItemId);

      const [documentResponse, claimItem] = await Promise.all([
        documentRespondePromise,
        claimItemPromise,
      ]);

      const documents = Array.from(documentResponse.values());
      claimItem.addDocuments(documents);

      await this.claimsService.saveClaimItem(claimItem);

      const {
        claim: { claimStatus, contactNumber, id },
      } = claimItem;

      // Continue the process of events only if no variation was detected with the claims data
      if (claimStatus !== ClaimStatus.VARIATIONS_DETECTED) {
        const claimItemInitiatedEventDto =
          await this.prepareClaimItemInitiatedEventDto(claimItem);

        console.log('Publishing to claim-initiated topic ...');
        await this.pubSubService.publishMessage(
          this.CLAIM_INITIATED_TOPIC,
          claimItemInitiatedEventDto,
        );

        return 'Documents uploaded successfully !';
      }

      console.log('Sending SMS to customer...');
      await this.notificationService.sendSMS(
        contactNumber,
        `Your claim - ${id} is currently on hold due to mismatch of data at TPA end. This will be resolved shortly...`,
      );

      return 'Documents uploaded successfully but data variations detected in claim values !';
    } catch (error) {
      throw new InternalServerErrorException(
        'Error occured during fileUpload or publishing event !',
        {
          cause: error,
          description: error.message,
        },
      );
    }
  }

  @Post('non-medical-fwa-handler')
  async nonMedicalFWACompletedHandler(@Body() pubSubMessage: PubSubMessageDto) {
    console.log('-------------------  -------------------');
    console.log('Non medical FWA hanlder invoked...');
    try {
      const {
        message: { data },
      } = pubSubMessage;

      const nonMedicalFWACompletedEventDto =
        this.pubSubService.formatMessageData<NonMedicalFWACompletedEventDto>(
          data,
          NonMedicalFWACompletedEventDto,
        );

      const { contactNumber, id } =
        await this.claimsService.updateNonMedicalFWAResults(
          nonMedicalFWACompletedEventDto,
        );

      console.log(
        'Updated claim and claimItem status with non medical FWA event results ...',
      );

      console.log('Sending SMS to customer...');
      await this.notificationService.sendSMS(
        contactNumber,
        `Your claim ID : ${id} is currently under review. You will recieve a message once it is completed.`,
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
  async nonMedicalAdjCompletedHandler(@Body() pubSubMessage: PubSubMessageDto) {
    console.log('-------------------  -------------------');
    console.log('Non medical adj completed hanlder invoked...');
    try {
      const {
        message: { data },
      } = pubSubMessage;

      const nonMedicalAdjEventCompletedDto =
        this.pubSubService.formatMessageData<NonMedicalAdjEventCompletedDto>(
          data,
          NonMedicalAdjEventCompletedDto,
        );

      await this.claimsService.updateNonMedicalAdjesults(
        nonMedicalAdjEventCompletedDto,
      );
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
  async medicalFWACompletedHandler(@Body() pubSubMessage: PubSubMessageDto) {
    console.log('-------------------  -------------------');
    console.log('Medical FWA hanlder invoked...');
    try {
      const {
        message: { data },
      } = pubSubMessage;

      const medicalFWACompletedEventDto =
        this.pubSubService.formatMessageData<MedicalFWACompletedEventDto>(
          data,
          MedicalFWACompletedEventDto,
        );

      await this.claimsService.updateMedicalFWAResults(
        medicalFWACompletedEventDto,
      );
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
  async medicalAdjCompletedHandler(@Body() pubSubMessage: PubSubMessageDto) {
    console.log('-------------------  -------------------');
    console.log('Medical adj hanlder invoked...');
    try {
      const {
        message: { data },
      } = pubSubMessage;

      const medicalAdjCompletedEventDto =
        this.pubSubService.formatMessageData<MedicalAdjCompletedEventDto>(
          data,
          MedicalAdjCompletedEventDto,
        );

      const claim = await this.claimsService.updateMedicalAdjResults(
        medicalAdjCompletedEventDto,
      );
      console.log(
        'claim and claimItem status updated with medical adj event ...',
      );

      if (claim.isDischarged) {
        const claimApprovedEventDto = this.prepareClaimApprovedEventDto(claim);

        console.log('Publishing to claim-approved topic ...');
        await this.pubSubService.publishMessage(
          this.CLAIM_APPROVED_TOPIC,
          claimApprovedEventDto,
        );
      }
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

  @Post('payment-status-changed-handler')
  async paymentStatusChangedHandler(@Body() pubSubMessage: PubSubMessageDto) {
    console.log('-------------------  -------------------');
    console.log('Payment status changed hanlder invoked...');
    try {
      const {
        message: { data },
      } = pubSubMessage;

      const paymentStatusChangedEventDto =
        this.pubSubService.formatMessageData<PaymentStatusChangedEventDto>(
          data,
          PaymentStatusChangedEventDto,
        );

      await this.claimsService.updatePaymentStatus(
        paymentStatusChangedEventDto,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Error occured while handling payment-status-changed event!',
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

  prepareClaimItemInitiatedEventDto(claimItem: ClaimItem) {
    const {
      id: claimItemId,
      totalAmount: claimItemTotalAmount,
      claimItemType,
      documents,
      claim,
    } = claimItem;

    const {
      id: claimId,
      policyNumber,
      insuranceCardNumber,
      tpaId,
      totalClaimAmount,
      approvedPayableAmount,
      coPayableAmount,
      hospitalId,
      accidentDetails,
      maternityDetails,
      doctorTreatmentDetails,
      patientAdmissionDetails,
      claimType,
      isAccident,
      isPregnancy,
      policyDetails,
      hospitalDetails,
      memberDetails,
    } = claim;

    // Including only claim related data. Redundant TPA data is not included.
    const claimItemInitiatedEventDto = new ClaimItemInitiatedEventDto({
      claimId,
      policyNumber,
      insuranceCardNumber,
      tpaId,
      hospitalId,
      totalClaimAmount,
      approvedPayableAmount,
      coPayableAmount,
      claimType,
      claimItemId,
      claimItemTotalAmount,
      claimItemType,
      isAccident,
      isPregnancy,
      patientAdmissionDetails,
      doctorTreatmentDetails,
      policyDetails,
      hospitalDetails,
      memberDetails,
      documents,
    });

    if (isAccident) {
      claimItemInitiatedEventDto.accidentDetails = accidentDetails;
    }

    if (isPregnancy) {
      claimItemInitiatedEventDto.maternityDetails = maternityDetails;
    }

    return claimItemInitiatedEventDto;
  }

  prepareClaimApprovedEventDto(claim: Claim) {
    const {
      id: claimId,
      claimType,
      approvedPayableAmount,
      coPayableAmount,
      claimStatus,
      contactNumber,
      hospitalDetails: { bankAccountName, bankAccountNumber, bankIfscCode },
    } = claim;

    const claimApprovedEventDto = new ClaimApprovedEventDto({
      claimId,
      claimType,
      claimStatus,
      contactNumber,
      approvedPayableAmount,
      coPayableAmount,
      bankAccountName,
      bankAccountNumber,
      bankIfscCode,
    });

    return claimApprovedEventDto;
  }

  validateDocumentsList(fieldNames: Array<string>) {
    console.log('Validating documents list...');

    const validDocumentNames = [
      'pre-authorization form',
      'doctor-prescription',
      'health-card',
    ];

    if (!fieldNames || !fieldNames.length) {
      throw new Error('Required documents missing : ' + validDocumentNames);
    }

    const missingDocumentNames = [];
    validDocumentNames.forEach((validDocument) => {
      if (!fieldNames.includes(validDocument)) {
        missingDocumentNames.push(validDocument);
      }
    });

    if (missingDocumentNames.length > 0) {
      throw new Error('Required documents missing : ' + missingDocumentNames);
    }
  }
}
