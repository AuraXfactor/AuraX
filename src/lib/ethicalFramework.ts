/**
 * Ethical Framework for Aura Z
 * Implements privacy, confidentiality, autonomy, beneficence, and non-maleficence principles
 */

export interface EthicalConsent {
  dataCollection: boolean;
  researchParticipation: boolean;
  dataSharing: boolean;
  anonymization: boolean;
  withdrawal: boolean;
  timestamp: Date;
  version: string;
}

export interface DataRetentionPolicy {
  sessionData: number; // days
  assessmentData: number; // days
  personalData: number; // days
  anonymizedData: number; // days
}

export interface PrivacySettings {
  dataCollection: boolean;
  researchParticipation: boolean;
  dataSharing: boolean;
  anonymization: boolean;
  locationTracking: boolean;
  analytics: boolean;
}

export class EthicalFramework {
  private static readonly DATA_RETENTION: DataRetentionPolicy = {
    sessionData: 90, // 3 months
    assessmentData: 365, // 1 year
    personalData: 2555, // 7 years (legal requirement)
    anonymizedData: 1825 // 5 years
  };

  private static readonly CONSENT_VERSION = '1.0';

  /**
   * Get default privacy settings with strictest options
   */
  static getDefaultPrivacySettings(): PrivacySettings {
    return {
      dataCollection: true, // Required for app functionality
      researchParticipation: false, // Opt-in by default
      dataSharing: false, // Opt-out by default
      anonymization: true, // Default to anonymized
      locationTracking: false, // Opt-out by default
      analytics: false // Opt-out by default
    };
  }

  /**
   * Create ethical consent record
   */
  static createConsentRecord(settings: PrivacySettings): EthicalConsent {
    return {
      dataCollection: settings.dataCollection,
      researchParticipation: settings.researchParticipation,
      dataSharing: settings.dataSharing,
      anonymization: settings.anonymization,
      withdrawal: true, // Always allow withdrawal
      timestamp: new Date(),
      version: this.CONSENT_VERSION
    };
  }

  /**
   * Validate data collection against consent
   */
  static validateDataCollection(consent: EthicalConsent, dataType: string): boolean {
    switch (dataType) {
      case 'session':
      case 'assessment':
      case 'personal':
        return consent.dataCollection;
      case 'research':
        return consent.researchParticipation;
      case 'analytics':
        return consent.dataSharing;
      default:
        return false;
    }
  }

  /**
   * Anonymize user data for research purposes
   */
  static anonymizeData(data: any): any {
    const anonymized = { ...data };
    
    // Remove direct identifiers
    delete anonymized.userId;
    delete anonymized.email;
    delete anonymized.name;
    delete anonymized.username;
    delete anonymized.location;
    delete anonymized.dateOfBirth;
    
    // Hash or remove sensitive fields
    if (anonymized.trigger) {
      anonymized.trigger = this.hashString(anonymized.trigger);
    }
    
    // Add anonymization metadata
    anonymized.anonymizedAt = new Date();
    anonymized.anonymizationVersion = this.CONSENT_VERSION;
    
    return anonymized;
  }

  /**
   * Check if data should be retained based on type and age
   */
  static shouldRetainData(dataType: string, createdAt: Date): boolean {
    const now = new Date();
    const ageInDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    switch (dataType) {
      case 'session':
        return ageInDays <= this.DATA_RETENTION.sessionData;
      case 'assessment':
        return ageInDays <= this.DATA_RETENTION.assessmentData;
      case 'personal':
        return ageInDays <= this.DATA_RETENTION.personalData;
      case 'anonymized':
        return ageInDays <= this.DATA_RETENTION.anonymizedData;
      default:
        return false;
    }
  }

  /**
   * Get data retention policy for user
   */
  static getDataRetentionPolicy(): DataRetentionPolicy {
    return this.DATA_RETENTION;
  }

  /**
   * Create privacy notice for user
   */
  static getPrivacyNotice(): string {
    return `
Aura Z Privacy & Ethics Notice

We are committed to protecting your privacy and following ethical principles in mental health care:

PRIVACY & CONFIDENTIALITY:
• Your data is encrypted and stored securely
• We never share your personal information without explicit consent
• All mental health data is treated with strict confidentiality

AUTONOMY:
• You control what data is collected and how it's used
• You can withdraw consent at any time
• You can delete your data at any time

BENEFICENCE (Do Good):
• We use your data to improve your mental health experience
• Research participation is always optional
• We provide personalized recommendations based on your needs

NON-MALEFICENCE (Do No Harm):
• We never use your data in ways that could harm you
• We provide crisis resources when needed
• We follow strict data security protocols

DATA RETENTION:
• Session data: 3 months
• Assessment data: 1 year
• Personal data: 7 years (legal requirement)
• Anonymized research data: 5 years

YOUR RIGHTS:
• Access your data
• Correct inaccurate data
• Delete your data
• Withdraw from research
• Export your data

For questions about your privacy rights, contact our privacy team.
    `.trim();
  }

  /**
   * Create crisis resources notice
   */
  static getCrisisResources(): string[] {
    return [
      'National Suicide Prevention Lifeline: 988',
      'Crisis Text Line: Text HOME to 741741',
      'Emergency Services: 911',
      'International Association for Suicide Prevention: iasp.info',
      'Your local emergency room'
    ];
  }

  /**
   * Validate research participation consent
   */
  static validateResearchConsent(consent: EthicalConsent): boolean {
    return consent.researchParticipation && 
           consent.anonymization && 
           consent.dataSharing;
  }

  /**
   * Create data export for user
   */
  static createDataExport(userData: any[]): any {
    return {
      exportDate: new Date(),
      dataTypes: [...new Set(userData.map(d => d.type))],
      recordCount: userData.length,
      data: userData,
      privacyNotice: this.getPrivacyNotice()
    };
  }

  /**
   * Hash string for anonymization
   */
  private static hashString(str: string): string {
    // Simple hash function for anonymization
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

export default EthicalFramework;