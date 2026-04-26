import { useState, useEffect } from "react";
import "./index.css";

export default function App() {
  const [view, setView] = useState("expenses");

  const [expenses, setExpenses] = useState([]);
  const [planned, setPlanned] = useState([]);
  const [budgets, setBudgets] = useState([]);

  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editingPlannedId, setEditingPlannedId] = useState(null);
  const [editingBudgetId, setEditingBudgetId] = useState(null);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("nourriture");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [ticketImage, setTicketImage] = useState(null);
  const [openedImage, setOpenedImage] = useState(null);

  const [pTitle, setPTitle] = useState("");
  const [pAmount, setPAmount] = useState("");
  const [pDay, setPDay] = useState("");

  const [budgetName, setBudgetName] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetCategory, setBudgetCategory] = useState("nourriture");

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const categories = ["nourriture", "transport", "logement", "loisirs", "crédit"];

  useEffect(() => {
    const e = localStorage.getItem("expenses");
    const p = localStorage.getItem("planned");
    const b = localStorage.getItem("budgets");

    if (e) setExpenses(JSON.parse(e));
    if (p) setPlanned(JSON.parse(p));
    if (b) setBudgets(JSON.parse(b));
  }, []);

  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem("planned", JSON.stringify(planned));
  }, [planned]);

  useEffect(() => {
    localStorage.setItem("budgets", JSON.stringify(budgets));
  }, [budgets]);

  const formatDate = (value) => {
    if (!value) return "";
    return value.split("-").reverse().join("-");
  };

  const handleTicketUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setTicketImage(reader.result);
    reader.readAsDataURL(file);
  };

  const quickCategory = (cat) => {
    setCategory(cat);
  };

  const resetExpenseForm = () => {
    setTitle("");
    setAmount("");
    setCategory("nourriture");
    setDate("");
    setNote("");
    setTicketImage(null);
    setEditingExpenseId(null);
  };

  const handleAddOrUpdateExpense = () => {
    if (!title || !amount || !date) return;

    if (editingExpenseId) {
      setExpenses(
        expenses.map((e) =>
          e.id === editingExpenseId
            ? {
                ...e,
                title,
                amount: parseFloat(amount),
                category,
                date,
                note,
                ticketImage,
              }
            : e
        )
      );
    } else {
      const newExpense = {
        id: Date.now(),
        title,
        amount: parseFloat(amount),
        category,
        date,
        note,
        ticketImage,
      };

      setExpenses([newExpense, ...expenses]);
    }

    resetExpenseForm();
  };

  const startEditExpense = (expense) => {
    setEditingExpenseId(expense.id);
    setTitle(expense.title);
    setAmount(expense.amount);
    setCategory(expense.category);
    setDate(expense.date);
    setNote(expense.note || "");
    setTicketImage(expense.ticketImage || null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteExpense = (id) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  const resetPlannedForm = () => {
    setPTitle("");
    setPAmount("");
    setPDay("");
    setEditingPlannedId(null);
  };

  const handleAddOrUpdatePlanned = () => {
    if (!pTitle || !pAmount || !pDay) return;

    const dayNumber = parseInt(pDay);
    if (dayNumber < 1 || dayNumber > 31) return;

    if (editingPlannedId) {
      setPlanned(
        planned
          .map((p) =>
            p.id === editingPlannedId
              ? {
                  ...p,
                  title: pTitle,
                  amount: parseFloat(pAmount),
                  day: dayNumber,
                }
              : p
          )
          .sort((a, b) => a.day - b.day)
      );
    } else {
      const newPlanned = {
        id: Date.now(),
        title: pTitle,
        amount: parseFloat(pAmount),
        day: dayNumber,
        paid: false,
      };

      setPlanned([...planned, newPlanned].sort((a, b) => a.day - b.day));
    }

    resetPlannedForm();
  };

  const startEditPlanned = (item) => {
    setEditingPlannedId(item.id);
    setPTitle(item.title);
    setPAmount(item.amount);
    setPDay(item.day);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const togglePaid = (id) => {
    setPlanned(
      planned.map((p) => (p.id === id ? { ...p, paid: !p.paid } : p))
    );
  };

  const deletePlanned = (id) => {
    setPlanned(planned.filter((p) => p.id !== id));
  };

  const resetMonth = () => {
    setPlanned(planned.map((p) => ({ ...p, paid: false })));
  };

  const resetBudgetForm = () => {
    setBudgetName("");
    setBudgetAmount("");
    setBudgetCategory("nourriture");
    setEditingBudgetId(null);
  };

  const handleAddOrUpdateBudget = () => {
    if (!budgetName || !budgetAmount || !budgetCategory) return;

    if (editingBudgetId) {
      setBudgets(
        budgets.map((b) =>
          b.id === editingBudgetId
            ? {
                ...b,
                name: budgetName,
                amount: parseFloat(budgetAmount),
                category: budgetCategory,
              }
            : b
        )
      );
    } else {
      const newBudget = {
        id: Date.now(),
        name: budgetName,
        amount: parseFloat(budgetAmount),
        category: budgetCategory,
      };

      setBudgets([newBudget, ...budgets]);
    }

    resetBudgetForm();
  };

  const startEditBudget = (budget) => {
    setEditingBudgetId(budget.id);
    setBudgetName(budget.name);
    setBudgetAmount(budget.amount);
    setBudgetCategory(budget.category);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteBudget = (id) => {
    setBudgets(budgets.filter((b) => b.id !== id));
  };

  const upcoming = planned.filter((p) => !p.paid);
  const paid = planned.filter((p) => p.paid);

  const totalExpenses = expenses
    .filter((e) => e.category !== "revenu")
    .reduce((a, b) => a + b.amount, 0);

  const totalIncome = expenses
    .filter((e) => e.category === "revenu")
    .reduce((a, b) => a + b.amount, 0);

  const balance = totalIncome - totalExpenses;
  const totalPlanned = upcoming.reduce((a, b) => a + b.amount, 0);

  const expenseCategories = expenses.filter((e) => e.category !== "revenu");

  const categoryTotals = expenseCategories.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount;
    return acc;
  }, {});

  const chartData = Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const maxCategoryAmount =
    chartData.length > 0 ? Math.max(...chartData.map((item) => item.value)) : 0;

  const filteredExpenses = expenses.filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase());

    const matchCategory =
      filterCategory === "all" || e.category === filterCategory;

    const matchType =
      filterType === "all" ||
      (filterType === "income" && e.category === "revenu") ||
      (filterType === "expense" && e.category !== "revenu");

    return matchSearch && matchCategory && matchType;
  });

  return (
    <div className="container">
      <h1>💰 MON BUDGET</h1>

      <div className="tabs">
        <button onClick={() => setView("expenses")}>Dépenses / Revenus</button>
        <button onClick={() => setView("planned")}>Prélèvements</button>
        <button onClick={() => setView("budgets")}>Budgets</button>
      </div>

      {view === "expenses" && (
        <>
          <div className="form">
            <input
              placeholder="Titre"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <input
              type="number"
              placeholder="Montant"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>nourriture</option>
              <option>transport</option>
              <option>logement</option>
              <option>loisirs</option>
              <option>crédit</option>
              <option>revenu</option>
            </select>

            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

            <input
              placeholder="Note optionnelle"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            <label className="fileLabel">
              📸 Ajouter / changer ticket
              <input type="file" accept="image/*" onChange={handleTicketUpload} />
            </label>

            {ticketImage && (
              <div className="ticketPreview">
                <img src={ticketImage} alt="Aperçu ticket" />
                <span>Ticket ajouté ✅</span>
              </div>
            )}

            <div className="quickButtons">
              <button type="button" onClick={() => quickCategory("nourriture")}>
                🍔 Nourriture
              </button>
              <button type="button" onClick={() => quickCategory("transport")}>
                ⛽ Transport
              </button>
              <button type="button" onClick={() => quickCategory("logement")}>
                🏠 Logement
              </button>
              <button type="button" onClick={() => quickCategory("loisirs")}>
                🎮 Loisirs
              </button>
              <button type="button" onClick={() => quickCategory("crédit")}>
                💳 Crédit
              </button>
            </div>

            <button onClick={handleAddOrUpdateExpense}>
              {editingExpenseId ? "Modifier la dépense" : "Ajouter"}
            </button>

            {editingExpenseId && (
              <button className="danger" onClick={resetExpenseForm}>
                Annuler modification
              </button>
            )}
          </div>

          <div className="dashboard">
            <p className="red">Paiements : {totalExpenses.toFixed(2)} €</p>
            <p className="green">Entrées : {totalIncome.toFixed(2)} €</p>
            <p className={`balance ${balance >= 0 ? "positive" : "negative"}`}>
              Solde : {balance > 0 ? "+" : ""}
              {balance.toFixed(2)} €
            </p>
          </div>

          <div className="chartBox">
            <h2>📊 Dépenses par catégorie</h2>

            {chartData.length === 0 ? (
              <p className="emptyText">Aucune dépense pour le moment.</p>
            ) : (
              <div className="chartList">
                {chartData.map((item) => (
                  <div key={item.name} className="chartRow">
                    <div className="chartInfo">
                      <span>{item.name}</span>
                      <strong>{item.value.toFixed(2)} €</strong>
                    </div>

                    <div className="barBackground">
                      <div
                        className="barFill"
                        style={{ width: `${(item.value / maxCategoryAmount) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="filters">
            <input
              placeholder="🔎 Rechercher une dépense..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">Toutes catégories</option>
              <option value="nourriture">Nourriture</option>
              <option value="transport">Transport</option>
              <option value="logement">Logement</option>
              <option value="loisirs">Loisirs</option>
              <option value="crédit">Crédit</option>
              <option value="revenu">Revenu</option>
            </select>

            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">Tout</option>
              <option value="expense">Paiements</option>
              <option value="income">Entrées</option>
            </select>
          </div>

          <div className="list">
            {filteredExpenses.map((e) => (
              <div
                key={e.id}
                className={`card ${e.category === "revenu" ? "income" : "expense"}`}
              >
                <h3>{e.title}</h3>
                <p>{e.amount.toFixed(2)} €</p>
                <p>{e.category}</p>
                <p>{formatDate(e.date)}</p>

                {e.note && <p className="noteBox">📝 {e.note}</p>}

                {e.ticketImage && (
                  <div className="ticketThumb" onClick={() => setOpenedImage(e.ticketImage)}>
                    <img src={e.ticketImage} alt="Ticket de caisse" />
                    <span>Voir ticket</span>
                  </div>
                )}

                <div className="actions">
                  <button onClick={() => startEditExpense(e)}>Modifier</button>
                  <button className="danger" onClick={() => deleteExpense(e.id)}>
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {view === "planned" && (
        <>
          <div className="form">
            <input
              placeholder="Nom prélèvement"
              value={pTitle}
              onChange={(e) => setPTitle(e.target.value)}
            />

            <input
              type="number"
              placeholder="Montant"
              value={pAmount}
              onChange={(e) => setPAmount(e.target.value)}
            />

            <input
              type="number"
              placeholder="Jour du mois 1-31"
              value={pDay}
              onChange={(e) => setPDay(e.target.value)}
            />

            <button onClick={handleAddOrUpdatePlanned}>
              {editingPlannedId ? "Modifier le prélèvement" : "Ajouter"}
            </button>

            {editingPlannedId && (
              <button className="danger" onClick={resetPlannedForm}>
                Annuler modification
              </button>
            )}
          </div>

          <div className="dashboard">
            <p className="red">Reste à prélever : {totalPlanned.toFixed(2)} €</p>
            <button onClick={resetMonth}>🔄 Nouveau mois</button>
          </div>

          <h2>⏳ À venir</h2>

          <div className="list">
            {upcoming.map((p) => (
              <div key={p.id} className="card expense">
                <h3>{p.title}</h3>
                <p>{p.amount.toFixed(2)} €</p>
                <p>Jour {p.day}</p>

                <div className="actions">
                  <button onClick={() => togglePaid(p.id)}>Marquer payé</button>
                  <button onClick={() => startEditPlanned(p)}>Modifier</button>
                  <button className="danger" onClick={() => deletePlanned(p.id)}>
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>

          <h2>✅ Payé</h2>

          <div className="list">
            {paid.map((p) => (
              <div key={p.id} className="card paid">
                <h3>{p.title}</h3>
                <p>{p.amount.toFixed(2)} €</p>
                <p>Jour {p.day}</p>

                <div className="actions">
                  <button onClick={() => togglePaid(p.id)}>Annuler</button>
                  <button onClick={() => startEditPlanned(p)}>Modifier</button>
                  <button className="danger" onClick={() => deletePlanned(p.id)}>
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {view === "budgets" && (
        <>
          <div className="form">
            <input
              placeholder="Nom de la jauge : Courses, Essence..."
              value={budgetName}
              onChange={(e) => setBudgetName(e.target.value)}
            />

            <input
              type="number"
              placeholder="Budget mensuel"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
            />

            <select value={budgetCategory} onChange={(e) => setBudgetCategory(e.target.value)}>
              {categories.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>

            <button onClick={handleAddOrUpdateBudget}>
              {editingBudgetId ? "Modifier la jauge" : "Créer la jauge"}
            </button>

            {editingBudgetId && (
              <button className="danger" onClick={resetBudgetForm}>
                Annuler modification
              </button>
            )}
          </div>

          <div className="budgetList">
            {budgets.map((budget) => {
              const spent = expenses
                .filter((e) => e.category === budget.category)
                .reduce((acc, e) => acc + e.amount, 0);

              const remaining = budget.amount - spent;
              const percentUsed = Math.min((spent / budget.amount) * 100, 100);
              const percentRemaining = Math.max(100 - percentUsed, 0);

              let gaugeClass = "safe";
              let alertText = "";

              if (percentRemaining <= 50) {
                gaugeClass = "warning";
                alertText = "⚠️ Attention, budget déjà bien entamé";
              }

              if (percentRemaining <= 20) {
                gaugeClass = "dangerGauge";
                alertText = "🚨 Budget presque vide";
              }

              if (percentRemaining <= 0) {
                alertText = "❌ Budget dépassé";
              }

              return (
                <div key={budget.id} className="budgetCard">
                  <div className="budgetHeader">
                    <div>
                      <h3>{budget.name}</h3>
                      <p>Lié à : {budget.category}</p>
                    </div>
                  </div>

                  <div className="budgetNumbers">
                    <span>Budget : {budget.amount.toFixed(2)} €</span>
                    <span>Dépensé : {spent.toFixed(2)} €</span>
                    <span className={remaining >= 0 ? "green" : "red"}>
                      Restant : {remaining.toFixed(2)} €
                    </span>
                  </div>

                  <div className={`gauge ${gaugeClass}`}>
                    <div className="gaugeFill" style={{ width: `${percentRemaining}%` }}></div>

                    <div className="weekMarks">
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>

                  {alertText && <p className="alertText">{alertText}</p>}

                  <div className="weekLabels">
                    <span>S1</span>
                    <span>S2</span>
                    <span>S3</span>
                    <span>S4</span>
                  </div>

                  <div className="actions">
                    <button onClick={() => startEditBudget(budget)}>Modifier</button>
                    <button className="danger" onClick={() => deleteBudget(budget.id)}>
                      Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {openedImage && (
        <div className="imageModal" onClick={() => setOpenedImage(null)}>
          <div className="imageModalContent" onClick={(e) => e.stopPropagation()}>
            <button className="closeModal" onClick={() => setOpenedImage(null)}>
              Fermer
            </button>
            <img src={openedImage} alt="Ticket agrandi" />
          </div>
        </div>
      )}
    </div>
  );
}
