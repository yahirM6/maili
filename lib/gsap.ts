import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { Observer } from 'gsap/Observer'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger, Observer, useGSAP)

// La barra de direcciones del móvil no debe provocar un refresh de los ScrollTrigger
ScrollTrigger.config({ ignoreMobileResize: true })

export { gsap, Observer, ScrollTrigger, useGSAP }
