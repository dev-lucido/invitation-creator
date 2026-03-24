import { Box, Paper, Typography, ButtonBase } from '@mui/material'
import { Language, LANGUAGES, Template } from '../types'

const FLAG: Record<Language, string> = {
  English: '🇬🇧',
  Sinhala: '🇱🇰',
  Tamil:   '🇮🇳',
}

interface Props {
  template: Template
  selected: Language | null
  onSelect: (lang: Language) => void
}

export default function LanguagePicker({ template, selected, onSelect }: Props) {
  // Only show languages that have an image variant (or all if template has no variants yet)
  const available: Language[] = template.variants && template.variants.length > 0
    ? LANGUAGES.filter(l => template.variants.some(v => v.lang === l))
    : LANGUAGES

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
        Select Language
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Choose the language for your invitation.
      </Typography>
      <Box display="flex" gap={2} flexWrap="wrap">
        {available.map(lang => {
          const isSelected = selected === lang
          return (
            <ButtonBase
              key={lang}
              onClick={() => onSelect(lang)}
              sx={{
                borderRadius: 2,
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              <Paper
                variant="outlined"
                sx={{
                  px: 3, py: 2.5,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  minWidth: 110,
                  border: '2px solid',
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  bgcolor: isSelected ? 'primary.main' : 'background.paper',
                  color: isSelected ? '#fff' : 'text.primary',
                  transition: 'all .15s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                  },
                }}
              >
                <Typography fontSize={32} lineHeight={1}>{FLAG[lang]}</Typography>
                <Typography variant="body2" fontWeight={700}>{lang}</Typography>
              </Paper>
            </ButtonBase>
          )
        })}
      </Box>
    </Box>
  )
}