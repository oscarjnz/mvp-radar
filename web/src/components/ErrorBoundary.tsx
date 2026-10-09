import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Cambia cuando cambia la página o el premio, para que el error no se quede pegado */
  resetKey: string
}

/** Evita que un error de dibujo deje toda la pantalla en negro. */
export default class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error al dibujar la página', error, info.componentStack)
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false })
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="wrap" role="alert">
        <h2>Algo salió mal al mostrar esta página</h2>
        <p className="muted">Puedes intentarlo de nuevo o volver al inicio.</p>
        <p style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => this.setState({ failed: false })}>Intentar de nuevo</button>
          <a className="btn" href="/">Volver al inicio</a>
        </p>
      </div>
    )
  }
}
