export class ClaimCreatedTemplate {
  type = 'template';
  name = 'customer_claim_raised';
  claimId: string;
  claimType: string;
  patientFullName: string;
  caretakerContactNumber: string;
  totalClaimAmount: string;

  constructor(data: {
    claimId: number;
    claimType: string;
    patientFullName: string;
    caretakerContactNumber: string;
    totalClaimAmount: number;
  }) {
    const {
      claimId,
      claimType,
      patientFullName,
      caretakerContactNumber,
      totalClaimAmount,
    } = data;

    this.claimId = claimId.toString();
    this.claimType = claimType;
    this.patientFullName = patientFullName;
    this.caretakerContactNumber = caretakerContactNumber;
    this.totalClaimAmount = totalClaimAmount.toString();
  }
}
