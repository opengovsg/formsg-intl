import React from 'react'
import {
  Box,
  chakra,
  Collapse,
  Flex,
  Stack,
  Text,
  useDisclosure,
  VisuallyHidden,
} from '@chakra-ui/react'

import { BxsBank } from '~assets/icons/BxsBank'
import { BxsLockAlt } from '~assets/icons/BxsLockAlt'
import { useIsMobile } from '~hooks/useIsMobile'

import { GovtMastheadItem } from './GovtMastheadItem'

export interface GovtMastheadProps {
  defaultIsOpen?: boolean
}

interface GovtMastheadChildrenProps {
  isOpen: boolean
  isMobile: boolean
  onToggle: () => void
  children: React.ReactNode
}

interface HeaderBarProps extends GovtMastheadChildrenProps {
  /**
   * ID of the expandable section for accessibility.
   */
  ariaControlId: string
}

const HeaderBar = ({
  isMobile,
  children,
  onToggle,
  isOpen,
  ariaControlId,
}: HeaderBarProps): JSX.Element => {
  const styleProps = {
    bg: 'neutral.200',
    py: { base: '0.5rem', md: '0.375rem' },
    px: { base: '1.5rem', md: '1.75rem', lg: '2rem' },
    textStyle: { base: 'legal', md: 'caption-2' },
    display: 'flex',
    width: '100%',
  }

  // Mobile
  if (isMobile) {
    return (
      <chakra.button
        aria-controls={ariaControlId}
        aria-describedby="masthead-aria"
        aria-expanded={isOpen}
        _focus={{
          boxShadow: '0 0 0 2px inset var(--chakra-colors-primary-500)',
        }}
        {...styleProps}
        onClick={onToggle}
      >
        <VisuallyHidden id="masthead-aria">
          {isOpen
            ? 'Collapse masthead'
            : 'Expand masthead to find out how to identify an official government website'}
        </VisuallyHidden>
        {children}
      </chakra.button>
    )
  }

  // Non-mobile
  return <Flex {...styleProps}>{children}</Flex>
}

export const GovtMasthead = ({
  defaultIsOpen,
}: GovtMastheadProps): JSX.Element => {
  const { onToggle, isOpen } = useDisclosure({ defaultIsOpen })
  const isMobile = useIsMobile()

  const ariaControlId = 'govt-masthead-expandable'

  return (
    <Box display="none">
      <HeaderBar
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onToggle={() => {}}
        isMobile={isMobile}
        isOpen={isOpen}
        ariaControlId={ariaControlId}
      >
        <Flex alignItems="center" flexWrap="wrap">
          <Text my="2px">A white-labelled build of FormSG</Text>
        </Flex>
      </HeaderBar>

      <Collapse in={isOpen} animateOpacity>
        <Stack
          direction={{ base: 'column', md: 'row' }}
          spacing={{ base: '1rem', md: '4.5rem', lg: '9.5rem' }}
          bg="neutral.200"
          px="2rem"
          py={{ base: '1.5rem', md: '2.25rem', lg: '2.75rem' }}
          textStyle={{ base: 'caption-2', lg: 'body-1' }}
          id={ariaControlId}
          aria-hidden={!isOpen}
        >
          <GovtMastheadItem
            icon={BxsBank}
            header="Official website links end with .gov.sg"
          >
            <Box textStyle={{ base: 'caption-2', md: 'body-1' }}></Box>
          </GovtMastheadItem>
          <GovtMastheadItem
            icon={BxsLockAlt}
            header="Secure websites use HTTPS"
          >
            <Box textStyle={{ base: 'caption-2', md: 'body-1' }}></Box>
          </GovtMastheadItem>
        </Stack>
      </Collapse>
    </Box>
  )
}
