// Vrais logos SVG des services

export function DriveIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
      <path d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 48.5c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 57c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 12.25z" fill="#ea4335"/>
      <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
      <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
      <path d="M73.4 26.5L60.7 4.5C59.9 3.1 58.75 2 57.4 1.2L43.65 25l16.15 28H87.3c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
    </svg>
  )
}

export function FigmaIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 38 57" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" fill="#1abcfe"/>
      <path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 0 1-19 0z" fill="#0acf83"/>
      <path d="M19 0v19h9.5a9.5 9.5 0 0 0 0-19H19z" fill="#ff7262"/>
      <path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" fill="#f24e1e"/>
      <path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" fill="#a259ff"/>
    </svg>
  )
}

export function GitHubIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="currentColor"
        d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"
      />
    </svg>
  )
}

export function NotionIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path
        style={{ fill: 'var(--surface1)' }}
        d="M6.017 4.313l55.333-4.087c6.797-.583 8.543-.19 12.817 2.913l17.663 12.43c2.913 2.137 3.883 2.723 3.883 5.053v68.243c0 4.277-1.553 6.807-6.99 7.193L24.467 99.967c-4.08.193-6.023-.39-8.16-3.113L3.7 80.507c-2.333-3.113-3.3-5.443-3.3-8.167V11.113c0-3.497 1.553-6.413 5.617-6.8z"
      />
      <path
        style={{ fill: 'var(--text1)' }}
        d="M61.35.227l-55.333 4.087C1.553 4.7 0 7.617 0 11.113v61.227c0 2.723.967 5.053 3.3 8.167l12.607 16.347c2.137 2.723 4.08 3.307 8.16 3.113l64.257-3.84c5.433-.387 6.99-2.917 6.99-7.193V18.623c0-2.193-.777-2.917-3.3-4.733L74.167 3.14C69.893.04 68.147-.357 61.35.227zM25.92 19.523c-5.247.353-6.437.433-9.417-1.99L8.927 11.507c-.77-.78-.383-1.753.97-1.947l53.2-3.887c4.467-.39 6.793 1.167 8.54 2.527l9.123 6.61c.387.2 1.357 1.36.193 1.36l-54.033 3.353zM19.373 88.503V30.173c0-2.53.777-3.697 3.103-3.893L85.2 22.4c2.13-.193 3.107 1.167 3.107 3.693v57.547c0 2.53-.973 4.313-3.107 4.503L22.48 92.2c-2.143.193-3.107-.973-3.107-3.697zm62.097-54.863c.387 1.75 0 3.5-1.75 3.7l-2.91.577v42.773c-2.527 1.36-4.853 2.137-6.797 2.137-3.107 0-3.883-.973-6.21-3.887l-19.03-29.94v28.967l6.02 1.363s0 3.5-4.857 3.5l-13.39.777c-.39-1.75 0-3.5 1.357-3.89l3.497-.97V36.553l-4.853-.387c-.39-1.75.58-4.277 3.3-4.473l14.367-.967 19.8 30.327V29.4l-5.043-.58c-.39-2.143.967-3.697 3.3-3.893l13.2-.777z"
      />
    </svg>
  )
}

export function GoogleDocIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 88" xmlns="http://www.w3.org/2000/svg">
      <path d="M58 88H6a6 6 0 0 1-6-6V6a6 6 0 0 1 6-6h36l22 22v60a6 6 0 0 1-6 6z" fill="#4285F4"/>
      <path d="M42 0l22 22H42V0z" fill="#1A73E8"/>
      <path d="M14 38h36v4H14zm0 10h36v4H14zm0 10h24v4H14z" fill="white"/>
    </svg>
  )
}

export function GoogleSheetIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 88" xmlns="http://www.w3.org/2000/svg">
      <path d="M58 88H6a6 6 0 0 1-6-6V6a6 6 0 0 1 6-6h36l22 22v60a6 6 0 0 1-6 6z" fill="#0F9D58"/>
      <path d="M42 0l22 22H42V0z" fill="#0B8043"/>
      <rect x="12" y="34" width="40" height="4" rx="1" fill="white"/>
      <rect x="12" y="34" width="40" height="28" rx="1" fill="white" opacity="0.9"/>
      <rect x="12" y="34" width="40" height="28" rx="1" fill="none" stroke="#0B8043" strokeWidth="1"/>
      <line x1="28" y1="34" x2="28" y2="62" stroke="#0B8043" strokeWidth="1"/>
      <line x1="12" y1="44" x2="52" y2="44" stroke="#0B8043" strokeWidth="1"/>
      <line x1="12" y1="53" x2="52" y2="53" stroke="#0B8043" strokeWidth="1"/>
    </svg>
  )
}

export function ExcelIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#169154" d="M29 6H15.744C14.781 6 14 6.781 14 7.744V13l15 5 16-5V7.744C45 6.781 44.219 6 43.256 6H29z"/>
      <path fill="#18482a" d="M14 13h31v5H14z"/>
      <path fill="#1a6b36" d="M14 18h31v5H14z"/>
      <path fill="#1a6b36" d="M14 23h31v5H14z"/>
      <path fill="#18482a" d="M14 28h31v5H14z"/>
      <path fill="#169154" d="M14 33h31v7.256C45 41.219 44.219 42 43.256 42H14v-9z"/>
      <path fill="#0c7238" d="M29 42H14V33h15v9z" opacity=".5"/>
      <path fill="#197c41" d="M14 33h15v5H14z" opacity=".25"/>
      <path d="M27.769 20H23l3.067 7.167L23 34h4.769L28 32l.231 2H33l-3.067-7 3.067-7H28.4L28 20h-.231z" fill="white"/>
      <path d="M3 10h13v28H3a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1z" fill="#107c41"/>
      <path fill="white" d="M6.698 26l3.066-4.5-3.066-4.5h2.764L11 20.558 12.538 17h2.764l-3.066 4.5L15.302 26h-2.764L11 22.442 9.462 26z"/>
    </svg>
  )
}

export function PdfIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M56 80H8a8 8 0 0 1-8-8V8a8 8 0 0 1 8-8h32l24 24v48a8 8 0 0 1-8 8z" fill="#F40F02"/>
      <path d="M40 0l24 24H40V0z" fill="#C00"/>
      <text x="8" y="60" fontFamily="Arial" fontWeight="bold" fontSize="18" fill="white">PDF</text>
    </svg>
  )
}

export function YoutubeIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" fill="#FF0000"/>
      <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="white"/>
    </svg>
  )
}

export function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export function VercelIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 22.525H0l12-21.05 12 21.05z" fill="currentColor"/>
    </svg>
  )
}

export function LinkIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Mapping type → icône + couleurs de fond
export const SERVICE_CONFIG: Record<string, {
  icon: (props: { size?: number }) => JSX.Element
  bg: string
  color: string
  label: string
}> = {
  'Drive':  { icon: DriveIcon,  bg: 'rgba(66,133,244,0.10)',  color: '#4285F4', label: 'Drive' },
  'Figma':  { icon: FigmaIcon,  bg: 'rgba(162,89,255,0.10)', color: '#a259ff', label: 'Figma' },
  'GitHub': { icon: GitHubIcon, bg: 'var(--surface3)',        color: 'var(--text2)', label: 'GitHub' },
  'Notion': { icon: NotionIcon, bg: 'var(--surface2)',        color: 'var(--text2)', label: 'Notion' },
  'Autre':  { icon: LinkIcon,   bg: 'var(--surface3)',        color: 'var(--text2)', label: 'Autre' },
}
