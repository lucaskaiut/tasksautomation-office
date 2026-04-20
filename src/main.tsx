import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { useGLTF } from '@react-three/drei'
import './index.css'
import App from './App.tsx'
import { OFFICE_ACTOR_DEFINITIONS, resolveCharacterModelUrl } from './office/officeActorDefinitions'
import { OFFICE_FURNITURE } from './office/officeFurniture'

const characterModelUrls = [...new Set(OFFICE_ACTOR_DEFINITIONS.map((d) => resolveCharacterModelUrl(d.character)))]
characterModelUrls.forEach((url) => useGLTF.preload(url))
const furnitureModelUrls = [
  ...new Set(OFFICE_FURNITURE.map((piece) => piece.modelUrl).filter((url): url is string => Boolean(url))),
]
furnitureModelUrls.forEach((url) => useGLTF.preload(url))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
