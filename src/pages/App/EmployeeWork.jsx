import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { onAuthStateChanged } from "firebase/auth"
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore"
import { auth, db } from "../../services/firebase"
import MenuBar from "../../components/App/Global/MenuBar"
import { ACCOUNT_ROLES, getUserAccessProfile } from "../../services/accessControl"
import "../../styles/App/TeamAccess.css"

export default function EmployeeWork() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [farmData, setFarmData] = useState(null)
  const [tasks, setTasks] = useState([])
  const [workStatus, setWorkStatus] = useState("trabalhando")

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/login", { replace: true })
        return
      }

      setUser(currentUser)
      const userProfile = await getUserAccessProfile(currentUser.uid)

      if (userProfile) {
        const data = userProfile
        setProfile(userProfile)
        setWorkStatus(data.status === "offline" ? "trabalhando" : data.status || "trabalhando")
      }

      const farmsRef = collection(db, "farms")
      let farmSnap = null

      if (userProfile?.farmId) {
        const farmDoc = await getDoc(doc(db, "farms", userProfile.farmId))
        if (farmDoc.exists()) {
          setFarmData({ id: farmDoc.id, ...farmDoc.data() })
        }
      } else {
        const ownerId = userProfile?.ownerId || userProfile?.teamId

        if (ownerId) {
          farmSnap = await getDocs(query(farmsRef, where("ownerId", "==", ownerId)))
        }

        if (farmSnap && !farmSnap.empty) {
          const farmDoc = farmSnap.docs[0]
          setFarmData({ id: farmDoc.id, ...farmDoc.data() })
        }
      }

      const taskQuery = query(collection(db, "activities"), where("assigneeId", "==", currentUser.uid))
      const taskSnap = await getDocs(taskQuery)
      setTasks(taskSnap.docs.map((taskDoc) => {
        const data = taskDoc.data()
        return {
          id: taskDoc.id,
          ...data,
          status: data.status === "andamento" ? "em_andamento" : data.status,
        }
      }))
    })

    return () => unsubscribe()
  }, [navigate])

  const stats = useMemo(() => {
    const total = tasks.length
    const done = tasks.filter((task) => task.status === "concluida").length

    return {
      pending: tasks.filter((task) => task.status === "pendente").length,
      active: tasks.filter((task) => task.status === "em_andamento").length,
      done,
      productivity: total === 0 ? null : Math.round((done / total) * 100),
    }
  }, [tasks])

  const roleLabel = profile?.role === ACCOUNT_ROLES.COLLABORATOR ? "colaborador" : "funcionário"

  const updateTaskStatus = async (taskId, status) => {
    setTasks((current) => current.map((task) => task.id === taskId ? { ...task, status } : task))

    try {
      await updateDoc(doc(db, "activities", taskId), {
        status,
        updatedAt: new Date().toISOString(),
        ...(status === "concluida" ? { completedAt: new Date().toISOString() } : {}),
      })
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error)
    }
  }

  const updateStatus = async (status) => {
    setWorkStatus(status)

    if (!user) return

    try {
      await updateDoc(doc(db, profile?.profileCollection || "employees", user.uid), {
        status,
        lastActivity: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
    }
  }

  return (
    <main className="team-page employee-page" data-system-bar-color="#f7f5f0">
      <section className="team-hero">
        <div>
          <span className="team-kicker">Area exclusiva do {roleLabel}</span>
          <h1>Funcionários</h1>
          <p>Olá, {profile?.name?.split(" ")[0] || "Funcionário"}. Acompanhe suas tarefas, horários, observações e desempenho individual.</p>
        </div>

        <div className="employee-clock-card">
          <span>Entrada</span>
          <strong>{profile?.entry || "--:--"}</strong>
          <span>Saída prevista</span>
          <strong>{profile?.exit || "--:--"}</strong>
        </div>
      </section>

      <section className="status-grid">
        {["trabalhando", "pausa", "ausente", "offline"].map((status) => (
          <button
            key={status}
            className={`status-chip ${workStatus === status ? "active" : ""}`}
            onClick={() => updateStatus(status)}
          >
            {status}
          </button>
        ))}
      </section>

      <section className="team-metrics">
        <article><span>Pendentes</span><strong>{stats.pending}</strong></article>
        <article><span>Em andamento</span><strong>{stats.active}</strong></article>
        <article><span>Concluídas</span><strong>{stats.done}</strong></article>
        <article><span>Produtividade</span><strong>{stats.productivity === null ? "--" : `${stats.productivity}%`}</strong></article>
      </section>

      <section className="team-panel employee-farm-panel">
        <div className="team-section-header">
          <h2>Dados da fazenda</h2>
          <span>Consulta operacional</span>
        </div>

        {farmData ? (
          <>
            <div className="employee-farm-header">
              <div className="employee-farm-icon">
                <span className="material-symbols-outlined">agriculture</span>
              </div>
              <div>
                <strong>{farmData.name || "Fazenda"}</strong>
                <p>{farmData.municipio || "Cidade não informada"}{farmData.uf ? `, ${farmData.uf}` : ""}</p>
              </div>
            </div>

            <div className="employee-farm-grid">
              <span>Área total <strong>{farmData.area_total || "0"} ha</strong></span>
              <span>Plantação <strong>{farmData.plantacao || "Não informada"}</strong></span>
              <span>Telefone <strong>{farmData.telefone_mascarado || farmData.telefone || "Não informado"}</strong></span>
              <span>CEP <strong>{farmData.cep || "Não informado"}</strong></span>
            </div>
          </>
        ) : (
          <p className="team-empty-text">Nenhuma fazenda vinculada ao seu perfil.</p>
        )}
      </section>

      <section className="team-panel">
        <div className="team-section-header">
          <h2>Minhas tarefas</h2>
          <span>{tasks.length} registros</span>
        </div>

        <div className="task-list">
          {tasks.map((task) => (
            <article className="task-card" key={task.id}>
              <div>
                <strong>{task.title}</strong>
                <p>Prazo: {task.date || task.dueDate || task.due || "Sem prazo"} • Prioridade: {task.priority || "Não informada"}</p>
              </div>
              <select value={task.status} onChange={(event) => updateTaskStatus(task.id, event.target.value)}>
                {task.status === "pendente" && <option value="pendente">Pendente</option>}
                {task.status === "pendente" && <option value="em_andamento">Iniciar tarefa</option>}
                {task.status === "em_andamento" && <option value="em_andamento">Em andamento</option>}
                {task.status === "em_andamento" && <option value="concluida">Concluir tarefa</option>}
                {task.status === "concluida" && <option value="concluida">Concluída</option>}
                {task.status === "cancelada" && <option value="cancelada">Cancelada</option>}
              </select>
            </article>
          ))}
          {tasks.length === 0 && <p className="team-empty-text">Nenhuma tarefa atribuída.</p>}
        </div>
      </section>

      <MenuBar />
    </main>
  )
}
