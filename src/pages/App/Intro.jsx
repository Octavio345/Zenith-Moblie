import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { onAuthStateChanged } from "firebase/auth"
import {
  Activity,
  ArrowRight,
  Leaf,
  LogIn,
  Radar,
  ScanSearch,
  ShieldCheck,
} from "lucide-react"

import { auth } from "../../services/firebase"
import LoadingScreen from "../../components/App/Home/LoadingScreen"
import "../../styles/App/Intro.css"

const Logo = "/assets/image/Logo-redonda.png"
const SoyCutout = "/assets/image/soja-hero-cutout.png"

const highlights = [
  { icon: ShieldCheck, label: "Diagnóstico confiável" },
  { icon: Activity, label: "Acompanhamento contínuo" },
  { icon: Radar, label: "Decisões em tempo real" },
]

export default function Intro() {
  const navigate = useNavigate()
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/home", { replace: true })
        return
      }

      setCheckingAuth(false)
    })

    return unsubscribe
  }, [navigate])

  if (checkingAuth) return <LoadingScreen />

  return (
    <main className="intro" data-system-bar-color="#f4f8ef">
      <div className="intro-orb intro-orb--top" aria-hidden="true" />
      <div className="intro-orb intro-orb--bottom" aria-hidden="true" />

      <div className="intro-shell">
        <header className="intro-brand" aria-label="Zenith">
          <div className="intro-brand__mark">
            <img src={Logo} alt="" draggable="false" />
          </div>
          <div className="intro-brand__copy">
            <strong>Zenith</strong>
            <span>Agricultura de precisão</span>
          </div>
          <span className="intro-brand__icon" aria-hidden="true">
            <Leaf size={19} strokeWidth={2} />
          </span>
        </header>

        <section className="intro-layout">
          <div className="intro-visual" aria-label="Lavoura monitorada pela plataforma Zenith">
            <div className="intro-visual__shade" aria-hidden="true" />
            <div className="intro-visual__grid" aria-hidden="true" />

            <div className="intro-visual__tag">
              <ScanSearch size={16} strokeWidth={2.1} />
              <span>Inteligência aplicada ao campo</span>
            </div>

            <img
              className="intro-visual__soy"
              src={SoyCutout}
              alt="Vagem de soja"
              draggable="false"
            />

            <div className="intro-visual__caption">
              <span className="intro-visual__signal" aria-hidden="true" />
              <div>
                <strong>Monitoramento ativo</strong>
                <small>Dados do campo em uma única visão</small>
              </div>
            </div>
          </div>

          <div className="intro-content">
            <div className="intro-eyebrow">
              <Radar size={16} strokeWidth={2.2} />
              <span>Tecnologia para quem produz</span>
            </div>

            <h1>
              Seu campo, visto com <em>mais precisão.</em>
            </h1>

            <p className="intro-description">
              Monitore lavouras, organize a operação e transforme imagens e dados em decisões mais seguras para a sua produção.
            </p>

            <div className="intro-highlights" aria-label="Benefícios da plataforma">
              {highlights.map(({ icon: Icon, label }) => (
                <div className="intro-highlight" key={label}>
                  <span aria-hidden="true">
                    <Icon size={18} strokeWidth={2} />
                  </span>
                  <small>{label}</small>
                </div>
              ))}
            </div>

            <div className="intro-actions">
              <button
                type="button"
                className="intro-button intro-button--primary"
                onClick={() => navigate("/register")}
              >
                <span>Começar agora</span>
                <ArrowRight size={19} strokeWidth={2.2} />
              </button>

              <button
                type="button"
                className="intro-button intro-button--secondary"
                onClick={() => navigate("/login")}
              >
                <LogIn size={18} strokeWidth={2.1} />
                <span>Já tenho uma conta</span>
              </button>
            </div>

            <p className="intro-footnote">
              Gestão agrícola, diagnóstico e monitoramento em uma experiência simples.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
