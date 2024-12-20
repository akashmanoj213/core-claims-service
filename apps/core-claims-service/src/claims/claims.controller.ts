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
  Logger,
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
import { PubSubService, NotificationService } from '@app/common-services';
import { ClaimItem } from './entities/claim-item.entity';
import { CreateEnhancementDto } from './dto/create-enhancement.dto';
import { CreateFinalSubmissionDto } from './dto/create-final-submission.dto';
import { CommandBus } from '@nestjs/cqrs';
import { CreateClaimCommand } from './commands/create-claim.command';
import {
  PubSubMessageDto,
  NonMedicalFWACompletedEventDto,
  NonMedicalAdjEventCompletedDto,
  ClaimItemInitiatedEventDto,
  MedicalAdjCompletedEventDto,
  MedicalFWACompletedEventDto,
  ClaimApprovedEventDto,
  PaymentStatusChangedEventDto,
  PasClaimSyncEventDto,
  ClaimItemType,
  AdjudicationItemStatus,
  ClaimRejectedEventDto,
  InstantCashlessFWACompletedEventDto,
  ClaimStatus,
} from '@app/common-dto';
import { MedicalBillDetails } from './entities/medical-bill-details.entity';
import { MedicalBillLineItem } from './entities/medical-bill-line-item.entity';
import { UpdateFinalSubmissionDto } from './dto/update-final-submission.dto';
import { ClaimCreatedTemplate, TextMessageTemplate } from '@app/common-classes';

@Controller('claims')
export class ClaimsController {
  private readonly CLAIM_INITIATED_TOPIC = 'claim-initiated';
  private readonly CLAIM_APPROVED_TOPIC = 'claim-approved';
  private readonly CLAIM_REJECTED_TOPIC = 'claim-rejected';
  private readonly PAS_CLAIM_SYNC_TOPIC = 'pas-claim-sync';
  private readonly INSTANT_CASHLESS_CLAIM_INITIATED_TOPIC =
    'instant-cashless-claim-initiated';
  private readonly logger = new Logger(ClaimsController.name);

  constructor(
    private readonly claimsService: ClaimsService,
    private pubSubService: PubSubService,
    private notificationService: NotificationService,
    private readonly commandBus: CommandBus,
  ) {}

  @Post()
  async create(@Body() createClaimDto: CreateClaimDto) {
    try {
      this.logger.log('-------------------  -------------------');
      this.logger.log('Create claim API invoked.');

      const {
        tpaId,
        claimType,
        insuranceCardNumber,
        policyNumber,
        hospitalId,
        isHospitalOptedForInstantApproval,
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
        isHospitalOptedForInstantApproval,
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

      // Emit command to create new claim
      await this.commandBus.execute(new CreateClaimCommand(claim));
      this.logger.log('Command executed succesfully');
      // const savedClaim = await this.claimsService.createClaim(initiatedClaim);

      // notify patient
      // await this.notificationService.sendSMS(
      //   contactNumber,
      //   `A new claim with claim ID : ${
      //     savedClaim.id
      //   } has been initiated and will be ${
      //     savedClaim.isInstantCashless ? 'approved' : 'reviewed'
      //   } shortly...`,
      // );

      // sync to PAS
      //await this.syncToPas(savedClaim.id);

      return initiatedClaim;
    } catch (error) {
      this.logger.error(`Failed to create new claim ! Error: ${error.message}`);
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
    @Body() test: object,
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

      // notify patient
      await this.notificationService.sendSMS(
        contactNumber,
        `Your claim ID: ${claimId} is currently on hold due to mismatch of data at TPA end. This will be resolved shortly...`,
      );

      // notify agent
      const textMessageTemplate = new TextMessageTemplate(
        `Claim ID: ${claimId} is currently on hold due to mismatch of data at TPA end. This will be resolved shortly...`,
      );
      await this.notificationService.sendWhatsappMessage(
        contactNumber,
        textMessageTemplate,
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

      const savedClaim = await this.claimsService.updateClaim(claim);

      const { contactNumber, claimItems } = savedClaim;

      const enhancementClaimItem = claimItems.sort((a, b) => b.id - a.id)[0];

      console.log(
        `New enhancement claim item created ! claimItemId: ${enhancementClaimItem.id}.`,
      );

      //notify patient
      await this.notificationService.sendSMS(
        contactNumber,
        `An enhancement request has been placed for your claim ID: ${claimId} and will be reviewed shortly...`,
      );

      // notify agent
      const textMessageTemplate = new TextMessageTemplate(
        `An enhancement request has been placed for claim ID: ${claimId} and will be reviewed shortly...`,
      );
      await this.notificationService.sendWhatsappMessage(
        contactNumber,
        textMessageTemplate,
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
      console.log('final-submission API invoked.');
      const { remainingAmount } = createFinalSubmissionDto;

      const claim = await this.claimsService.createFinalSubmission(
        claimId,
        remainingAmount,
      );

      const savedClaim = await this.claimsService.updateClaim(claim);
      const { contactNumber, claimItems } = savedClaim;
      const finalClaimItem = claimItems.sort((a, b) => b.id - a.id)[0];
      console.log(
        `Final claim item created! claimItmeId : ${finalClaimItem.id}.`,
      );

      // notify patient
      await this.notificationService.sendSMS(
        contactNumber,
        `A final discharge request has been placed for your claim ID: ${claimId} and will be reviewed shortly...`,
      );

      // notify agent
      const textMessageTemplate = new TextMessageTemplate(
        `A final discharge request has been placed for claim ID: ${claimId} and will be reviewed shortly...`,
      );
      await this.notificationService.sendWhatsappMessage(
        contactNumber,
        textMessageTemplate,
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

  @Post('/:claimId/medical-bill-details')
  async updateMedicalBillDetails(
    @Param('claimId') claimId: number,
    @Body() updateFinalSubmissionDto: UpdateFinalSubmissionDto,
  ) {
    try {
      console.log('-------------------  -------------------');
      console.log('medical-bill-details API invoked.');
      const { medicalBillDetails } = updateFinalSubmissionDto;

      //if detailed medical bills are present, save to claim
      if (medicalBillDetails && medicalBillDetails.length) {
        const medicalBills: MedicalBillDetails[] = [];

        medicalBillDetails.forEach((medicalBillDto) => {
          const {
            billNumber,
            billDate,
            totalAmount,
            lineItems: lineItemsDto,
          } = medicalBillDto;

          const lineItems: MedicalBillLineItem[] = [];

          lineItemsDto.forEach((lineItemDto) => {
            const {
              icd10Level1,
              icd10Level2,
              icd10Level3,
              amount,
              rate,
              unit,
            } = lineItemDto;

            const lineItem = new MedicalBillLineItem({
              rate,
              unit,
              amount,
              icd10Level1,
              icd10Level2,
              icd10Level3,
            });

            lineItems.push(lineItem);
          });

          const medicalBill = new MedicalBillDetails({
            billDate,
            billNumber,
            totalAmount,
            lineItems,
          });

          medicalBills.push(medicalBill);
        });

        const savedClaim = await this.claimsService.updateMedicalBillDetails(
          claimId,
          medicalBills,
        );
        console.log(`Claim id ${claimId} updated with medical bill details.`);

        //Sync to PAS
        await this.syncToPas(claimId);

        return savedClaim;
      } else {
        throw new Error('No medical bill details attached!');
      }
    } catch (error) {
      console.log(
        `Failed to update medical bill details ! Error: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Failed to update medical bill details !',
        {
          cause: error,
          description: error.message,
        },
      );
    }
  }

  @Get('icd-10-code/level3')
  async getIcd10Level3Codes() {
    try {
      return this.claimsService.getICD10Level3Codes();
    } catch (error) {
      console.log(
        `Error occured while retrieving ICD-10 Level 3 codes ! Error: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Error occured while retrieving ICD-10 Level 3 codes !',
        {
          cause: error,
          description: error.message,
        },
      );
    }
  }

  @Get('icd-10-code/level2')
  async getIcd10Level2Codes() {
    try {
      return this.claimsService.getICD10Level2Codes();
    } catch (error) {
      console.log(
        `Error occured while retrieving ICD-10 Level 2 codes ! Error: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Error occured while retrieving ICD-10 Level 2 codes !',
        {
          cause: error,
          description: error.message,
        },
      );
    }
  }

  @Get('icd-10-code/level1')
  async getIcd10Level1Codes() {
    try {
      return this.claimsService.getICD10Level1Codes();
    } catch (error) {
      console.log(
        `Error occured while retrieving ICD-10 Level 1 codes ! Error: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Error occured while retrieving ICD-10 Level 1 codes !',
        {
          cause: error,
          description: error.message,
        },
      );
    }
  }

  @Get('/:claimId/medical-bill-details')
  async getMedicalBillDetails(@Param('claimId') claimId: number) {
    try {
      return this.claimsService.getMedicalBillDetails(claimId);
    } catch (error) {
      console.log(
        `Error occured while retrieving medical bill details ! Error: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Error occured while retrieving medical bill details !',
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

      // notify patient
      await this.notificationService.sendSMS(
        contactNumber,
        `Your claim ID: ${claimId} is currently under review. You will receive a message once it is completed.`,
      );

      // notify agent
      const textMessageTemplate = new TextMessageTemplate(
        `Claim ID: ${claimId} is currently under review. You will receive a message once it is completed.`,
      );
      await this.notificationService.sendWhatsappMessage(
        contactNumber,
        textMessageTemplate,
      );

      // sync to PAS
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
        claim: { id: claimId, contactNumber },
      } = await this.claimsService.updateNonMedicalAdjResults(
        nonMedicalAdjEventCompletedDto,
      );

      //Sync to PAS
      await this.syncToPas(claimId);

      // notify agent
      const agentMessage = `Claim ID: ${claimId} completed non-medical adjudication.`;
      const textMessageTemplate = new TextMessageTemplate(agentMessage);
      await this.notificationService.sendWhatsappMessage(
        contactNumber,
        textMessageTemplate,
      );
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
      let agentMessage = `Claim ID: ${claim.id} completed medical adjudication.`;

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

            agentMessage += ' Final Submission APPROVED.';
          } else {
            agentMessage += ' Status: APPROVED.';
          }
          break;

        case AdjudicationItemStatus.REJECTED:
          {
            console.log('Claim Item rejected !');
            const claimRejectedEventDto =
              this.prepareClaimRejectedEventDto(claim);

            console.log('Publishing to claim-rejected topic.');
            await this.pubSubService.publishMessage(
              this.CLAIM_REJECTED_TOPIC,
              claimRejectedEventDto,
            );

            agentMessage += ' Status: REJECTED.';
          }
          break;

        default:
          break;
      }

      // notify agent
      const textMessageTemplate = new TextMessageTemplate(agentMessage);
      await this.notificationService.sendWhatsappMessage(
        claim.contactNumber,
        textMessageTemplate,
      );
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

      const { contactNumber, id: claimId } = claim;

      // notify patient
      await this.notificationService.sendSMS(
        contactNumber,
        `Good news, Your claim ID: ${claimId} has been approved instantly!`,
      );

      // notify agent
      const textMessageTemplate = new TextMessageTemplate(
        `Claim ID: ${claimId} has been approved instantly!`,
      );
      await this.notificationService.sendWhatsappMessage(
        contactNumber,
        textMessageTemplate,
      );

      // const claimApprovedEventDto = this.prepareClaimApprovedEventDto(claim);

      // console.log('Publishing to claim-approved topic.');
      // await this.pubSubService.publishMessage(
      //   this.CLAIM_APPROVED_TOPIC,
      //   claimApprovedEventDto,
      // );

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

  @Post('create-claim-event-handler')
  async handleCreateClaimEvent(@Body() claim: Claim) {
    this.logger.log('Handler to create claim invoked!');

    const savedClaim = await this.claimsService.createClaim(claim);

    const {
      contactNumber,
      caretakerContactNumber,
      patientAdmissionDetails: { patientFullName },
      claimType,
      totalClaimAmount,
      id: claimId,
    } = savedClaim;

    // notify patient
    // await this.notificationService.sendSMS(
    //   caretakerContactNumber,
    //   `A new claim with claim ID : ${
    //     savedClaim.id
    //   } has been initiated and will be ${
    //     savedClaim.isInstantCashless ? 'approved' : 'reviewed'
    //   } shortly...`,
    // );

    //notify agent - temp
    // const message = `A customer has raised a claim with claim ID : ${claimId}. \n Patient name: ${patientFullName}.\n Claim type: ${claimType}.\n Total claim amount: ${totalClaimAmount}.\n \n Claim status : https://pruinhlth-nprd-dev-scxlyx-7250.el.r.appspot.com/claim#/pasclaim?claimId=${claimId}`;
    // await this.notificationService.sendSMS(contactNumber, message);

    // notify agent
    const claimCreatedTemplate = new ClaimCreatedTemplate({
      claimId,
      claimType,
      patientFullName,
      caretakerContactNumber,
      totalClaimAmount,
    });

    this.logger.log('claimCreatedTemplate : ', claimCreatedTemplate);

    await this.notificationService.sendWhatsappMessage(
      contactNumber,
      claimCreatedTemplate,
    );

    // sync to PAS
    await this.syncToPas(savedClaim.id);

    return savedClaim;
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

  @Get('stream/:streamId')
  findOneByStreamId(@Param('streamId') streamId: string) {
    return this.claimsService.findClaimBySreamId(streamId);
  }

  @Get('test')
  test() {
    console.log('Controller: core claims controller is working fine.');
    return this.claimsService.getTestResponse();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.claimsService.findClaim(id);
  }

  @Get()
  findAll() {
    this.logger.log('Fetching all claims...');
    return this.claimsService.findAll();
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

    const pasClaimSyncEventDto = new PasClaimSyncEventDto(claimId);
    await this.pubSubService.publishMessage(
      this.PAS_CLAIM_SYNC_TOPIC,
      pasClaimSyncEventDto,
    );
  }
}
