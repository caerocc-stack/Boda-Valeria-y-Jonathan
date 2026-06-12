export interface GroupMember {
  id: string;
  name: string;
  downloaded: boolean;
}

export type MenuType = 'Principal' | 'Vegetariano' | 'Vegano' | 'Celíaco-Sin TACC' | 'Infantil';

export interface PartyPreferences {
  menuType: MenuType;
  celiac: boolean;
  diabetic: boolean;
  lactoseIntolerant: boolean;
  peanutAllergy: boolean;
  extraDetails: string;
}

export interface BankInfo {
  bank: string;
  cbu: string;
  alias: string;
  titular: string;
}

export interface WeddingConfig {
  scriptUrl: string;
  bankInfo: BankInfo;
  noviosEmail: string;     // correo de los novios para recibir las confirmaciones
  bankConfigured: boolean; // cuando true, se oculta el botón de configurar datos bancarios
}

export type InvitationState = {
  step: number;
  attending: boolean | null; // true: yes, false: no, null: not chosen yet
  groupSize: number;
  members: GroupMember[];
  preferences: PartyPreferences;
  messageOnly: string; // for those who do not attend (mandatory message/wishes)
  photoUrl: string; // Background photo previsualized by host/guest
  groupCombinedDownloaded: boolean;
};
