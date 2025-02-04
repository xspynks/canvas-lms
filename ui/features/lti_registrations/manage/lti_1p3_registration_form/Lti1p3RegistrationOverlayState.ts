/*
 * Copyright (C) 2024 - present Instructure, Inc.
 *
 * This file is part of Canvas.
 *
 * Canvas is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import type {StoreApi} from 'zustand'
import type {LtiMessageType} from '../model/LtiMessageType'
import type {LtiPlacement} from '../model/LtiPlacement'
import type {LtiPrivacyLevel} from '../model/LtiPrivacyLevel'
import type {LtiScope} from '@canvas/lti/model/LtiScope'
import type {InternalLtiConfiguration} from '../model/internal_lti_configuration/InternalLtiConfiguration'
import create from 'zustand'

export type Lti1p3RegistrationOverlayState = {
  launchSettings: Partial<{
    redirectURIs: string
    targetLinkURI: string
    openIDConnectInitiationURL: string
    JwkMethod: 'public_jwk_url' | 'public_jwk'
    JwkURL: string
    Jwk: string
    domain: string
    customFields: string
  }>
  permissions: {
    scopes?: LtiScope[]
  }
  data_sharing: {
    privacy_level?: LtiPrivacyLevel
  }
  placements: {
    placements?: LtiPlacement[]
    courseNavigationDefaultDisabled?: boolean
  }
  override_uris: {
    placements: Record<
      LtiPlacement,
      {
        message_type?: LtiMessageType
        uri?: string
      }
    >
  }
  naming: {
    nickname?: string
    description?: string
    notes?: string
    placements: Record<
      LtiPlacement,
      {
        name?: string
      }
    >
  }
  icons: {
    placements: Record<
      LtiPlacement,
      {
        icon_url?: string
      }
    >
  }
}

export interface Lti1p3RegistrationOverlayActions {
  setRedirectURIs: (redirectURIs: string) => void
  setDefaultTargetLinkURI: (targetLinkURI: string) => void
  setOIDCInitiationURI: (oidcInitiationURI: string) => void
  setJwkMethod: (
    jwkMethod: Required<Lti1p3RegistrationOverlayState['launchSettings']['JwkMethod']>
  ) => void
  setJwkURL: (jwkURL: string) => void
  setJwk: (jwk: string) => void
  setDomain: (domain: string) => void
  setCustomFields: (customFields: string) => void
  toggleScope: (scope: LtiScope) => void
  setPrivacyLevel: (privacyLevel: LtiPrivacyLevel) => void
  togglePlacement: (placement: LtiPlacement) => void
  toggleCourseNavigationDefaultDisabled: () => void
}

export type Lti1p3RegistrationOverlayStore = StoreApi<
  {
    state: Lti1p3RegistrationOverlayState
  } & Lti1p3RegistrationOverlayActions
>

const updateState =
  (f: (state: Lti1p3RegistrationOverlayState) => Lti1p3RegistrationOverlayState) =>
  (fullState: {state: Lti1p3RegistrationOverlayState}): {state: Lti1p3RegistrationOverlayState} =>
    stateFor(f(fullState.state))

const stateFor = (state: Lti1p3RegistrationOverlayState) => ({state})

const updateLaunchSetting = <K extends keyof Lti1p3RegistrationOverlayState['launchSettings']>(
  key: K,
  value: Lti1p3RegistrationOverlayState['launchSettings'][K]
) =>
  updateState(state => ({
    ...state,
    launchSettings: {
      ...state.launchSettings,
      [key]: value,
    },
  }))

export const createLti1p3RegistrationOverlayStore = (internalConfig: InternalLtiConfiguration) =>
  create<{state: Lti1p3RegistrationOverlayState} & Lti1p3RegistrationOverlayActions>(set => ({
    state: initialOverlayStateFromInternalConfig(internalConfig),
    setRedirectURIs: redirectURIs => set(updateLaunchSetting('redirectURIs', redirectURIs)),
    setDefaultTargetLinkURI: targetLinkURI =>
      set(updateLaunchSetting('targetLinkURI', targetLinkURI)),
    setOIDCInitiationURI: oidcInitiationURI =>
      set(updateLaunchSetting('openIDConnectInitiationURL', oidcInitiationURI)),
    setJwkURL: jwkURL => set(updateLaunchSetting('JwkURL', jwkURL)),
    setJwk: jwk => set(updateLaunchSetting('Jwk', jwk)),
    setJwkMethod: jwkMethod => set(updateLaunchSetting('JwkMethod', jwkMethod)),
    setDomain: domain => set(updateLaunchSetting('domain', domain)),
    setCustomFields: customFields => set(updateLaunchSetting('customFields', customFields)),
    toggleScope: scope => {
      set(
        updateState(state => {
          let updatedScopes = state.permissions.scopes

          if (updatedScopes?.includes(scope)) {
            updatedScopes = updatedScopes.filter(s => s !== scope)
          } else {
            updatedScopes = [...(updatedScopes ?? []), scope]
          }
          return {
            ...state,
            permissions: {
              ...state.permissions,
              scopes: updatedScopes,
            },
          }
        })
      )
    },
    setPrivacyLevel: privacyLevel =>
      set(
        updateState(state => ({
          ...state,
          data_sharing: {
            ...state.data_sharing,
            privacy_level: privacyLevel,
          },
        }))
      ),
    toggleCourseNavigationDefaultDisabled: () => {
      set(
        updateState(state => {
          return {
            ...state,
            placements: {
              ...state.placements,
              courseNavigationDefaultDisabled: !state.placements.courseNavigationDefaultDisabled,
            },
          }
        })
      )
    },
    togglePlacement: placement => {
      set(
        updateState(state => {
          let updatedPlacements = state.placements.placements

          if (updatedPlacements?.includes(placement)) {
            updatedPlacements = updatedPlacements.filter(p => p !== placement)
          } else {
            updatedPlacements = [...(updatedPlacements ?? []), placement]
          }

          return {
            ...state,
            placements: {
              ...state.placements,
              placements: updatedPlacements,
            },
          }
        })
      )
    },
  }))

const initialOverlayStateFromInternalConfig = (
  internalConfig: InternalLtiConfiguration
): Lti1p3RegistrationOverlayState => {
  return {
    launchSettings: {
      redirectURIs: internalConfig.redirect_uris?.join('\n'),
      targetLinkURI: internalConfig.target_link_uri,
      openIDConnectInitiationURL: internalConfig.oidc_initiation_url,
      JwkMethod: internalConfig.public_jwk_url ? 'public_jwk_url' : 'public_jwk',
      JwkURL: internalConfig.public_jwk_url,
      Jwk: JSON.stringify(internalConfig.public_jwk),
      domain: internalConfig.domain,
      customFields: internalConfig.custom_fields
        ? Object.entries(internalConfig.custom_fields).reduce((acc, [key, value]) => {
            return acc + `${key}=${value}\n`
          }, '')
        : undefined,
    },
    permissions: {
      scopes: internalConfig.scopes,
    },
    data_sharing: {
      privacy_level: internalConfig.privacy_level,
    },
    placements: {
      placements: internalConfig.placements.map(p => p.placement) ?? [],
      courseNavigationDefaultDisabled:
        internalConfig.placements.find(p => p.placement === 'course_navigation')?.default ===
        'disabled',
    },
    override_uris: {
      placements: internalConfig.placements.reduce<
        Record<LtiPlacement, {message_type: LtiMessageType; uri: string}>
      >((acc, p) => {
        acc[p.placement] = {
          message_type: p.message_type ?? 'LtiResourceLinkRequest',
          uri: p.url ?? internalConfig.target_link_uri,
        }
        return acc
      }, {} as Record<LtiPlacement, {message_type: LtiMessageType; uri: string}>),
    },
    naming: {
      nickname: internalConfig.title,
      description: '',
      notes: '',
      placements:
        internalConfig.placements.reduce<Record<LtiPlacement, {name: string}>>((acc, p) => {
          acc[p.placement] = {name: p.text ?? internalConfig.title}
          return acc
        }, {} as Record<LtiPlacement, {name: string}>) ?? [],
    },
    icons: {
      placements: internalConfig.placements.reduce<Record<LtiPlacement, {icon_url?: string}>>(
        (acc, p) => {
          acc[p.placement] = {icon_url: p.icon_url}
          return acc
        },
        {} as Record<LtiPlacement, {icon_url?: string}>
      ),
    },
  }
}
