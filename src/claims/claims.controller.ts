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
import { ClaimItem, ClaimItemStatus } from './entities/claim-item.entity';
import { NotificationService } from 'src/core/providers/notification/notification.service';
import { CreateEnhancementDto } from './dto/create-enhancement.dto';
import { CreateFinalSubmissionDto } from './dto/create-final-submission.dto';
import { ClaimApprovedEventDto } from 'src/core/dto/claim-approved-event.dto';
import { PaymentStatusChangedEventDto } from 'src/core/dto/payment-status-changed-event.dto';
import { PasClaimSyncDto } from './dto/pas-claim-sync.dto';
import { ClaimItemType } from 'src/core/enums';
import { AdjudicationItemStatus } from 'src/claims-adjudication/entities/adjudication-item.entity';
import { ClaimRejectedEventDto } from 'src/core/dto/claim-rejected-event.dto';
import { InstantCashlessFWACompletedEventDto } from 'src/core/dto/instant-cashless-fwa-completed.dto';

@Controller('claims')
export class ClaimsController {
  private readonly CLAIM_INITIATED_TOPIC = 'claim-initiated';
  private readonly CLAIM_APPROVED_TOPIC = 'claim-approved';
  private readonly CLAIM_REJECTED_TOPIC = 'claim-rejected';
  private readonly PAS_CLAIM_SYNC_TOPIC = 'pas-claim-sync';
  private readonly INSTANT_CASHLESS_CLAIM_INITIATED_TOPIC =
    'instant-cashless-claim-initiated';

  constructor(
    private readonly claimsService: ClaimsService,
    private pubSubService: PubSubService,
    private notificationService: NotificationService,
  ) {}

  @Post()
  async create(@Body() createClaimDto: CreateClaimDto) {
    try {
      console.log('-------------------  -------------------');
      console.log('Create claim API invoked.');

      const {
        tpaId,
        claimType,
        insuranceCardNumber,
        policyNumber,
        hospitalId,
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
      const pastHistoryOfChronicIllness = pastHistoryOfChronicIllnessDto
        ? pastHistoryOfChronicIllnessDto.map(
            (pastChronicIllness) => new PastChronicIllness(pastChronicIllness),
          )
        : null;

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

      // initiate new claim and check variations
      const initiatedClaim = await this.claimsService.initiateAndVerifyClaim(
        claim,
      );

      // save new claim
      const savedClaim = await this.claimsService.saveClaim(initiatedClaim);

      // notify customer
      await this.notificationService.sendSMS(
        contactNumber,
        `A new claim with claim ID : ${
          savedClaim.id
        } has been initiated and will be ${
          savedClaim.isInstantCashless ? 'approved' : 'reviewed'
        } shortly...`,
      );

      // sync to PAS
      await this.syncToPas(savedClaim.id);

      return savedClaim;
    } catch (error) {
      console.log(`Failed to create new claim ! Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to create new claim !', {
        cause: error,
        description: error.message,
      });
    }
  }

  @Post('claim-item/:claimItemId/file-upload')
  @UseInterceptors(AnyFilesInterceptor())
  async fileUpload(
    @Param('claimItemId') claimItemId: number,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    console.log('-------------------  -------------------');
    console.log('fileUpload API invoked.');
    try {
      const fieldNames = [];

      if (!files || files.length === 0) {
        console.log('No file attached with request.');
        throw new Error(
          `There are no files attached. Please attach the required documents.`,
        );
      }

      files.forEach((file) => {
        fieldNames.push(file.fieldname);
      });

      const claimItem = await this.claimsService.findClaimItem(claimItemId);

      if (!claimItem) {
        throw new Error(
          `No claim item found for claim item ID: ${claimItemId}`,
        );
      }

      const {
        claim: { claimStatus, contactNumber, id: claimId, isInstantCashless },
        claimItemType,
      } = claimItem;

      // allow file upload only if documents are not uploaded
      if (claimItem.documents && claimItem.documents.length) {
        throw new Error(
          `There are files already uploaded for claim item ID : ${claimItem.id}`,
        );
      }

      // validate document list
      this.validateDocumentsList(fieldNames, claimItemType, isInstantCashless);

      const documentResponse = await this.claimsService.processDocumentUploads(
        files,
      );
      const documents = Array.from(documentResponse.values());
      claimItem.addDocuments(documents);

      await this.claimsService.saveClaimItem(claimItem);

      // sync to PAS
      await this.syncToPas(claimId);

      // continue the processing of events only if no variation was detected with the claims data
      if (claimStatus !== ClaimStatus.VARIATIONS_DETECTED) {
        const claimItemInitiatedEventDto =
          this.prepareClaimItemInitiatedEventDto(claimItem);

        if (isInstantCashless) {
          console.log('Publishing to instant-cashless-claim-initiated topic.');
          await this.pubSubService.publishMessage(
            this.INSTANT_CASHLESS_CLAIM_INITIATED_TOPIC,
            claimItemInitiatedEventDto,
          );
        } else {
          console.log('Publishing to claim-initiated topic.');
          await this.pubSubService.publishMessage(
            this.CLAIM_INITIATED_TOPIC,
            claimItemInitiatedEventDto,
          );
        }

        return 'Documents uploaded successfully !';
      }

      // notify customer
      await this.notificationService.sendSMS(
        contactNumber,
        `Your claim ID: ${claimId} is currently on hold due to mismatch of data at TPA end. This will be resolved shortly...`,
      );

      return 'Documents uploaded successfully but data variations detected in claim values !';
    } catch (error) {
      console.log(
        `Error occured during fileUpload or publishing event ! ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Error occured during fileUpload or publishing event !',
        {
          cause: error,
          description: error.message,
        },
      );
    }
  }

  @Post('/:claimId/enhancement')
  async addEnhancement(
    @Param('claimId') claimId: number,
    @Body() createEnhancementDto: CreateEnhancementDto,
  ) {
    try {
      console.log('-------------------  -------------------');
      console.log('addEnhancement API invoked.');
      const { enhancementAmount } = createEnhancementDto;

      const claim = await this.claimsService.createEnhancement(
        claimId,
        enhancementAmount,
      );

      const savedClaim = await this.claimsService.saveClaim(claim);

      const { contactNumber, claimItems } = savedClaim;

      const enhancementClaimItem = claimItems.sort((a, b) => b.id - a.id)[0];

      console.log(
        `New enhancement claim item created ! claimItemId: ${enhancementClaimItem.id}.`,
      );

      await this.notificationService.sendSMS(
        contactNumber,
        `An enhancement request has been placed for your claim ID: ${claimId} and will be reviewed shortly...`,
      );

      // sync to PAS
      await this.syncToPas(claimId);

      return enhancementClaimItem;
    } catch (error) {
      console.log(
        `Failed to create enhancement claim item ! Error: ${error.message}`,
      );
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
      console.log('-------------------  -------------------');
      console.log('addFinalSubmission API invoked.');
      const { remainingAmount } = createFinalSubmissionDto;

      const claim = await this.claimsService.createFinalSubmission(
        claimId,
        remainingAmount,
      );

      const savedClaim = await this.claimsService.saveClaim(claim);
      const { contactNumber, claimItems } = savedClaim;
      const finalClaimItem = claimItems.sort((a, b) => b.id - a.id)[0];
      console.log(
        `Final claim item created! claimItmeId : ${finalClaimItem.id}.`,
      );

      await this.notificationService.sendSMS(
        contactNumber,
        `A final discharge request has been placed for your claim ID: ${claimId} and will be reviewed shortly...`,
      );

      //Sync to PAS
      await this.syncToPas(claimId);

      return finalClaimItem;
    } catch (error) {
      console.log(
        `Failed to create final submission claim item ! Error: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Failed to create final submission claim item !',
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
    console.log('Non medical FWA completed hanlder invoked.');
    try {
      const nonMedicalFWACompletedEventDto =
        this.pubSubService.formatMessageData<NonMedicalFWACompletedEventDto>(
          pubSubMessage,
          NonMedicalFWACompletedEventDto,
        );

      const { contactNumber, id: claimId } =
        await this.claimsService.updateNonMedicalFWAResults(
          nonMedicalFWACompletedEventDto,
        );

      await this.notificationService.sendSMS(
        contactNumber,
        `Your claim ID: ${claimId} is currently under review. You will recieve a message once it is completed.`,
      );

      //Sync to PAS
      await this.syncToPas(claimId);
    } catch (error) {
      console.log(
        `Error occured while handling non-medical-fwa-completed event ! Error: ${error.message}`,
      );
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
    console.log('Non medical adj completed hanlder invoked.');
    try {
      const nonMedicalAdjEventCompletedDto =
        this.pubSubService.formatMessageData<NonMedicalAdjEventCompletedDto>(
          pubSubMessage,
          NonMedicalAdjEventCompletedDto,
        );

      const {
        claim: { id: claimId },
      } = await this.claimsService.updateNonMedicalAdjResults(
        nonMedicalAdjEventCompletedDto,
      );

      //Sync to PAS
      await this.syncToPas(claimId);
    } catch (error) {
      console.log(
        `Error occured while handling non-medical-adj-completed event ! Error: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Error occured while handling non-medical-adj-completed event !',
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
    console.log('Medical FWA completed hanlder invoked.');
    try {
      const medicalFWACompletedEventDto =
        this.pubSubService.formatMessageData<MedicalFWACompletedEventDto>(
          pubSubMessage,
          MedicalFWACompletedEventDto,
        );

      const {
        claim: { id: claimId },
      } = await this.claimsService.updateMedicalFWAResults(
        medicalFWACompletedEventDto,
      );

      // sync to PAS
      await this.syncToPas(claimId);
    } catch (error) {
      console.log(
        `Error occured while handling medical-fwa-completed event ! ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Error occured while handling medical-fwa-completed event !',
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
    console.log('Medical adj completed hanlder invoked.');
    try {
      const medicalAdjCompletedEventDto =
        this.pubSubService.formatMessageData<MedicalAdjCompletedEventDto>(
          pubSubMessage,
          MedicalAdjCompletedEventDto,
        );

      const claim = await this.claimsService.updateMedicalAdjResults(
        medicalAdjCompletedEventDto,
      );

      //Sync to PAS
      await this.syncToPas(claim.id);

      const { status } = medicalAdjCompletedEventDto;

      switch (status) {
        case AdjudicationItemStatus.APPROVED:
          if (claim.isFinal) {
            console.log('Final claim item approved.');
            const claimApprovedEventDto =
              this.prepareClaimApprovedEventDto(claim);

            console.log('Publishing to claim-approved topic.');
            await this.pubSubService.publishMessage(
              this.CLAIM_APPROVED_TOPIC,
              claimApprovedEventDto,
            );
          }
          break;

        case AdjudicationItemStatus.REJECTED:
          console.log('Claim Item rejected !');
          const claimRejectedEventDto =
            this.prepareClaimRejectedEventDto(claim);

          console.log('Publishing to claim-rejected topic.');
          await this.pubSubService.publishMessage(
            this.CLAIM_REJECTED_TOPIC,
            claimRejectedEventDto,
          );

        default:
          break;
      }
    } catch (error) {
      console.log(
        `Error occured while handling medical-adj-completed event ! ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Error occured while handling medical-adj-completed event!',
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
    console.log('Payment status changed hanlder invoked.');
    try {
      const paymentStatusChangedEventDto =
        this.pubSubService.formatMessageData<PaymentStatusChangedEventDto>(
          pubSubMessage,
          PaymentStatusChangedEventDto,
        );

      const { id: claimId } = await this.claimsService.updatePaymentStatus(
        paymentStatusChangedEventDto,
      );

      //Sync to PAS
      await this.syncToPas(claimId);
    } catch (error) {
      console.log(
        `Error occured while handling payment-status-changed event ! Error: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Error occured while handling payment-status-changed event !',
        {
          cause: error,
          description: error.message,
        },
      );
    }
  }

  @Post('instant-cashless-fwa-completed-handler')
  async instantCashlessFWACompletedHandler(
    @Body() pubSubMessage: PubSubMessageDto,
  ) {
    console.log('-------------------  -------------------');
    console.log('instant cashless fwa completed hanlder invoked.');

    try {
      const instantCashlessFWACompletedEventDto =
        this.pubSubService.formatMessageData<InstantCashlessFWACompletedEventDto>(
          pubSubMessage,
          InstantCashlessFWACompletedEventDto,
        );

      const claim = await this.claimsService.updateAllFWAResults(
        instantCashlessFWACompletedEventDto,
      );

      const claimApprovedEventDto = this.prepareClaimApprovedEventDto(claim);

      console.log('Publishing to claim-approved topic.');
      await this.pubSubService.publishMessage(
        this.CLAIM_APPROVED_TOPIC,
        claimApprovedEventDto,
      );

      // sync to PAS
      await this.syncToPas(claim.id);
    } catch (error) {
      console.log(
        `Error occured while handling instant-cashless-fwa-completed event ! ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Error occured while handling instant-cashless-fwa-completed event !',
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

  @Get()
  findAll() {
    return this.claimsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.claimsService.findClaim(id);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.claimsService.remove(id);
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
      isInstantCashless,
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
      isInstantCashless,
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
      claimStatus, // check if required, else combine this and claimRejectedDtp
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

  prepareClaimRejectedEventDto(claim: Claim) {
    const {
      id: claimId,
      claimType,
      approvedPayableAmount,
      coPayableAmount,
      contactNumber,
      hospitalDetails: { bankAccountName, bankAccountNumber, bankIfscCode },
    } = claim;

    const claimRejectedEventDto = new ClaimRejectedEventDto({
      claimId,
      claimType,
      contactNumber,
      approvedPayableAmount,
      coPayableAmount,
      bankAccountName,
      bankAccountNumber,
      bankIfscCode,
    });

    return claimRejectedEventDto;
  }

  validateDocumentsList(
    fieldNames: Array<string>,
    claimItemType: ClaimItemType,
    isInstantCashless = false,
  ) {
    console.log('Validating documents list.');

    if (!fieldNames || !fieldNames.length) {
      throw new Error('Document field names (keys) missing !');
    }

    const initialClaimDocNames = [
      'pre-authorization form',
      'doctor-prescription',
      'health-card',
    ];
    const enhancementClaimDocNames = ['interim-bill'];
    const finalClaimDocNames = ['discharge-summary', 'detailed-bill-summary'];

    const missingDocumentNames = [];

    switch (claimItemType) {
      case ClaimItemType.INTIAL:
        initialClaimDocNames.forEach((docName) => {
          if (!fieldNames.includes(docName)) missingDocumentNames.push(docName);
        });
        break;

      case ClaimItemType.ENHANCEMENT:
        enhancementClaimDocNames.forEach((docName) => {
          if (!fieldNames.includes(docName)) missingDocumentNames.push(docName);
        });
        break;

      case ClaimItemType.FINAL:
        const docNames = isInstantCashless
          ? initialClaimDocNames
          : finalClaimDocNames;

        docNames.forEach((docName) => {
          if (!fieldNames.includes(docName)) missingDocumentNames.push(docName);
        });
        break;

      default:
        break;
    }

    if (missingDocumentNames.length) {
      throw new Error('Required documents missing : ' + missingDocumentNames);
    }
  }

  async syncToPas(claimId: number) {
    console.log('Syncing to PAS claims topic.');

    const pasClaimSyncDto = new PasClaimSyncDto(claimId);
    await this.pubSubService.publishMessage(
      this.PAS_CLAIM_SYNC_TOPIC,
      pasClaimSyncDto,
    );
  }
}
