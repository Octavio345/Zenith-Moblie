export default function LoadingScreen() {
  return (
    <div
      className="loading-screen route-page-loader app-opening-route-loader"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="route-page-loader__mark" aria-hidden="true">
        <span className="material-symbols-outlined">eco</span>
        <i aria-hidden="true" />
      </div>
      <strong>Zenith</strong>
    </div>
  )
}
