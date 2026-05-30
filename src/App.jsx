import { useEffect, useMemo, useState } from 'react';
import './index.css';

const defaultPaymentRefs = ['Courses', 'Essence', 'Crédit', 'Assurance', 'Loisirs'];
const defaultIncomeRefs = ['Salaire', 'CAF', 'Remboursement', 'Vente', 'Autre'];

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function todayFr() {
  return new Date().toLocaleDateString('fr-FR');
}

function nowFr() {
  return new Date().toLocaleString('fr-FR');
}

function parseFrDate(value) {
  const parts = value.split('/');
  if (parts.length !== 3) return new Date();
  return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
}

function formatMonth(date) {
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function sameMonth(dateText, selectedMonth) {
  const date = parseFrDate(dateText);
  return date.getMonth() === selectedMonth.getMonth() && date.getFullYear() === selectedMonth.getFullYear();
}

function isCurrentMonth(selectedMonth) {
  const now = new Date();
  return selectedMonth.getMonth() === now.getMonth() && selectedMonth.getFullYear() === now.getFullYear();
}

function isPastMonth(selectedMonth) {
  const now = new Date();
  return selectedMonth.getFullYear() < now.getFullYear() ||
    (selectedMonth.getFullYear() === now.getFullYear() && selectedMonth.getMonth() < now.getMonth());
}

function isDebitPassed(day, selectedMonth) {
  if (isPastMonth(selectedMonth)) return true;
  if (!isCurrentMonth(selectedMonth)) return false;
  return new Date().getDate() >= Number(day);
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function CameraIcon() {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h4l2-2h6l2 2h4v12H3V7zm9 3a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showExpenseDetails, setShowExpenseDetails] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [transactions, setTransactions] = useState(() => load('transactions', []));
  const [paymentRefs, setPaymentRefs] = useState(() => load('paymentRefs', defaultPaymentRefs));
  const [incomeRefs, setIncomeRefs] = useState(() => load('incomeRefs', defaultIncomeRefs));
  const [monthlyDebits, setMonthlyDebits] = useState(() => load('monthlyDebits', []));
  const [budgets, setBudgets] = useState(() => load('budgets', []));
  const [lastBackup, setLastBackup] = useState(() => localStorage.getItem('lastBackup') || '');

  const [type, setType] = useState('paiement');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(todayFr());

  const [debitName, setDebitName] = useState('');
  const [debitAmount, setDebitAmount] = useState('');
  const [debitDay, setDebitDay] = useState('');

  const [newPaymentRef, setNewPaymentRef] = useState('');
  const [newIncomeRef, setNewIncomeRef] = useState('');

  const [budgetRef, setBudgetRef] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');

  const [receiptImage, setReceiptImage] = useState('');

  useEffect(() => localStorage.setItem('transactions', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('paymentRefs', JSON.stringify(paymentRefs)), [paymentRefs]);
  useEffect(() => localStorage.setItem('incomeRefs', JSON.stringify(incomeRefs)), [incomeRefs]);
  useEffect(() => localStorage.setItem('monthlyDebits', JSON.stringify(monthlyDebits)), [monthlyDebits]);
  useEffect(() => localStorage.setItem('budgets', JSON.stringify(budgets)), [budgets]);
  useEffect(() => localStorage.setItem('lastBackup', lastBackup), [lastBackup]);

  const monthTransactions = transactions.filter(t => sameMonth(t.date, selectedMonth));

  const totalIncome = monthTransactions
    .filter(t => t.type === 'revenu')
    .reduce((s, t) => s + Number(t.amount), 0);

  const totalPayment = monthTransactions
    .filter(t => t.type === 'paiement')
    .reduce((s, t) => s + Number(t.amount), 0);

  const passedDebits = monthlyDebits.filter(d => isDebitPassed(d.day, selectedMonth));
  const remainingDebits = monthlyDebits.filter(d => !isDebitPassed(d.day, selectedMonth));

  const totalPassedDebits = passedDebits.reduce((s, d) => s + Number(d.amount), 0);
  const totalRemainingDebits = remainingDebits.reduce((s, d) => s + Number(d.amount), 0);

  const totalDoneExpenses = totalPayment + totalPassedDebits;
  const balance = totalIncome - totalDoneExpenses;

  const sortedMonthlyDebits = [...monthlyDebits].sort((a, b) => Number(a.day) - Number(b.day));
  const refsToUse = type === 'paiement' ? paymentRefs : incomeRefs;

  const expensesByCategory = useMemo(() => {
    const result = {};
    monthTransactions
      .filter(t => t.type === 'paiement')
      .forEach(t => {
        result[t.reference] = (result[t.reference] || 0) + Number(t.amount);
      });

    return Object.entries(result)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [monthTransactions]);

  const maxCategoryAmount = Math.max(...expensesByCategory.map(c => c.value), 1);

  const budgetData = budgets.map(budget => {
    const spent = monthTransactions
      .filter(t => t.type === 'paiement' && t.reference === budget.ref)
      .reduce((s, t) => s + Number(t.amount), 0);

    const percent = Number(budget.amount) > 0 ? (spent / Number(budget.amount)) * 100 : 0;

    return { ...budget, spent, percent };
  });

  const budgetAlerts = budgetData.filter(b => b.percent >= 80);

  const tickets = transactions.filter(t => t.receiptImage);

  function changeMonth(direction) {
    setSelectedMonth(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + direction);
      return next;
    });
  }

  function addTransaction(e) {
    e.preventDefault();
    if (!amount || !reference || !date) return;

    setTransactions([
      { id: Date.now(), type, amount: Number(amount), reference, date, receiptImage },
      ...transactions,
    ]);

    setAmount('');
    setReference('');
    setDate(todayFr());
    setReceiptImage('');
    setActiveTab('home');
  }

  function addMonthlyDebit(e) {
    e.preventDefault();
    if (!debitName || !debitAmount || !debitDay) return;
    if (Number(debitDay) < 1 || Number(debitDay) > 31) return;

    setMonthlyDebits([
      ...monthlyDebits,
      { id: Date.now(), name: debitName, amount: Number(debitAmount), day: Number(debitDay) },
    ]);

    setDebitName('');
    setDebitAmount('');
    setDebitDay('');
  }

  function handleReceiptPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setReceiptImage(reader.result);
    reader.readAsDataURL(file);
  }

  function addPaymentRef() {
    const value = newPaymentRef.trim();
    if (value && !paymentRefs.includes(value)) setPaymentRefs([...paymentRefs, value]);
    setNewPaymentRef('');
  }

  function addIncomeRef() {
    const value = newIncomeRef.trim();
    if (value && !incomeRefs.includes(value)) setIncomeRefs([...incomeRefs, value]);
    setNewIncomeRef('');
  }

  function addBudget(e) {
    e.preventDefault();
    if (!budgetRef || !budgetAmount) return;

    const existing = budgets.find(b => b.ref === budgetRef);

    if (existing) {
      setBudgets(budgets.map(b => b.ref === budgetRef ? { ...b, amount: Number(budgetAmount) } : b));
    } else {
      setBudgets([...budgets, { id: Date.now(), ref: budgetRef, amount: Number(budgetAmount) }]);
    }

    setBudgetRef('');
    setBudgetAmount('');
  }

  function exportJson() {
    const backupDate = nowFr();

    const data = {
      version: 2,
      savedAt: backupDate,
      transactions,
      paymentRefs,
      incomeRefs,
      monthlyDebits,
      budgets,
    };

    setLastBackup(backupDate);

    downloadFile(
      'mon-budget-sauvegarde.json',
      JSON.stringify(data, null, 2),
      'application/json'
    );
  }

  function importJson(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);

        const confirmImport = window.confirm(
          'Restaurer cette sauvegarde ? Les données actuelles seront remplacées.'
        );

        if (!confirmImport) return;

        setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
        setPaymentRefs(Array.isArray(data.paymentRefs) ? data.paymentRefs : defaultPaymentRefs);
        setIncomeRefs(Array.isArray(data.incomeRefs) ? data.incomeRefs : defaultIncomeRefs);
        setMonthlyDebits(Array.isArray(data.monthlyDebits) ? data.monthlyDebits : []);
        setBudgets(Array.isArray(data.budgets) ? data.budgets : []);

        setLastBackup(data.savedAt || nowFr());
        alert('Sauvegarde restaurée avec succès.');
        setActiveTab('home');
      } catch {
        alert('Fichier invalide. Impossible de restaurer la sauvegarde.');
      }

      e.target.value = '';
    };

    reader.readAsText(file);
  }

  function exportCsv() {
    const header = 'type;reference;montant;date\n';
    const rows = transactions.map(t => `${t.type};${t.reference};${t.amount};${t.date}`).join('\n');
    downloadFile('mon-budget-transactions.csv', header + rows, 'text/csv');
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Mon Magot</h1>
          <p>
            {activeTab === 'home' && 'Vue d’ensemble'}
            {activeTab === 'stats' && 'Statistiques'}
            {activeTab === 'budgets' && 'Budgets'}
            {activeTab === 'add' && 'Ajout rapide'}
            {activeTab === 'tickets' && 'Tickets'}
            {activeTab === 'settings' && 'Réglages'}
          </p>
        </div>
        <button className="icon-btn" type="button">🔔</button>
      </header>

      {activeTab !== 'settings' && activeTab !== 'add' && (
        <div className="month-switcher">
          <button type="button" onClick={() => changeMonth(-1)}>‹</button>
          <strong>{formatMonth(selectedMonth)}</strong>
          <button type="button" onClick={() => changeMonth(1)}>›</button>
        </div>
      )}

      {activeTab === 'home' && (
        <>
          <div className="balance-card">
            <span>Solde affiché</span>
            <strong>{balance.toFixed(2)} €</strong>
          </div>

          <div className="quick-grid two-cards">
            <div className="quick-card">
              <span>Revenus</span>
              <strong className="income">{totalIncome.toFixed(2)} €</strong>
            </div>

            <button className="quick-card clickable-card" type="button" onClick={() => setShowExpenseDetails(!showExpenseDetails)}>
              <span>Prélèv. & dépenses</span>
              <small className="mini-line">Effectué : -{totalDoneExpenses.toFixed(2)} €</small>
              <small className="mini-line remaining">À venir : -{totalRemainingDebits.toFixed(2)} €</small>
            </button>
          </div>

          {showExpenseDetails && (
            <section className="card details-card">
              <h2>Détail des sorties</h2>
              <div className="detail-row"><span>Dépenses saisies</span><strong className="payment">-{totalPayment.toFixed(2)} €</strong></div>
              <div className="detail-row"><span>Prélèv. effectués</span><strong className="payment">-{totalPassedDebits.toFixed(2)} €</strong></div>
              <div className="detail-row"><span>Prélèv. à venir</span><strong className="future-text">-{totalRemainingDebits.toFixed(2)} €</strong></div>
            </section>
          )}

          <section className="notifications">
            <h2>Notifications</h2>

            {passedDebits.length === 0 && budgetAlerts.length === 0 && <p>Aucune alerte pour le moment.</p>}

            {passedDebits.map(debit => (
              <div className="alert debit-alert" key={debit.id}>
                Prélèvement effectué : <strong>{debit.name}</strong> - {Number(debit.amount).toFixed(2)} €
              </div>
            ))}

            {budgetAlerts.map(budget => (
              <div className="alert budget-alert" key={budget.id}>
                Budget presque dépassé : <strong>{budget.ref}</strong>
              </div>
            ))}
          </section>

          <section className="card">
            <h2>Historique récent</h2>
            {monthTransactions.length === 0 ? <p>Aucune opération ce mois-ci.</p> : monthTransactions.slice(0, 6).map(t => (
              <div className="transaction" key={t.id}>
                <strong>{t.reference}</strong>
                <small>{t.date}</small>
                <span className={t.type === 'revenu' ? 'income' : 'payment'}>
                  {t.type === 'revenu' ? '+' : '-'}{Number(t.amount).toFixed(2)} €
                </span>
                {t.receiptImage && <small>Ticket enregistré</small>}
                <button type="button" onClick={() => setTransactions(transactions.filter(x => x.id !== t.id))}>Supprimer</button>
              </div>
            ))}
          </section>
        </>
      )}

      {activeTab === 'stats' && (
        <>
          <section className="card">
            <h2>Revenus vs dépenses</h2>
            <div className="stat-row">
              <span>Revenus</span>
              <strong className="income">{totalIncome.toFixed(2)} €</strong>
            </div>
            <div className="stat-row">
              <span>Dépenses effectuées</span>
              <strong className="payment">-{totalDoneExpenses.toFixed(2)} €</strong>
            </div>
            <div className="stat-row">
              <span>Solde</span>
              <strong className={balance >= 0 ? 'income' : 'payment'}>{balance.toFixed(2)} €</strong>
            </div>
          </section>

          <section className="card">
            <h2>Dépenses par catégorie</h2>

            {expensesByCategory.length === 0 ? (
              <p>Aucune dépense ce mois-ci.</p>
            ) : (
              expensesByCategory.map(cat => (
                <div className="category-bar" key={cat.name}>
                  <div className="category-head">
                    <span>{cat.name}</span>
                    <strong>{cat.value.toFixed(2)} €</strong>
                  </div>
                  <div className="bar">
                    <div style={{ width: `${Math.max((cat.value / maxCategoryAmount) * 100, 5)}%` }}></div>
                  </div>
                </div>
              ))
            )}
          </section>
        </>
      )}

      {activeTab === 'budgets' && (
        <section className="card">
          <h2>Budgets par catégorie</h2>

          <form onSubmit={addBudget}>
            <select value={budgetRef} onChange={e => setBudgetRef(e.target.value)}>
              <option value="">Choisir une dépense...</option>
              {paymentRefs.map(ref => <option key={ref} value={ref}>{ref}</option>)}
            </select>

            <input
              type="number"
              placeholder="Budget max du mois"
              value={budgetAmount}
              onChange={e => setBudgetAmount(e.target.value)}
            />

            <button type="submit">Ajouter / modifier</button>
          </form>

          {budgetData.length === 0 ? (
            <p>Aucun budget défini.</p>
          ) : (
            budgetData.map(budget => (
              <div className="budget-card" key={budget.id}>
                <div className="category-head">
                  <span>{budget.ref}</span>
                  <strong>{budget.spent.toFixed(2)} € / {Number(budget.amount).toFixed(2)} €</strong>
                </div>
                <div className="bar">
                  <div className={budget.percent >= 100 ? 'danger' : budget.percent >= 80 ? 'warning' : ''} style={{ width: `${Math.min(budget.percent, 100)}%` }}></div>
                </div>
                <small>{Math.round(budget.percent)} % utilisé</small>
                <button type="button" className="delete-btn" onClick={() => setBudgets(budgets.filter(b => b.id !== budget.id))}>Supprimer</button>
              </div>
            ))
          )}
        </section>
      )}

      {activeTab === 'add' && (
        <>
          <form className="card" onSubmit={addTransaction}>
            <h2>Ajouter une opération</h2>

            <select value={type} onChange={e => { setType(e.target.value); setReference(''); }}>
              <option value="paiement">Paiement</option>
              <option value="revenu">Revenu</option>
            </select>

            <input type="number" placeholder="Montant" value={amount} onChange={e => setAmount(e.target.value)} />

            <select value={reference} onChange={e => setReference(e.target.value)}>
              <option value="">{type === 'paiement' ? 'Ajouter une dépense...' : 'Ajouter un revenu...'}</option>
              {refsToUse.map(ref => <option key={ref} value={ref}>{ref}</option>)}
            </select>

            <input type="text" placeholder="JJ/MM/AAAA" value={date} onChange={e => setDate(e.target.value)} />

            <div className="receipt-box">
              <h3>Photo ticket de caisse</h3>

              <label className="receipt-upload-label">
                <CameraIcon />
                Scanner un ticket
                <input className="receipt-file-input" type="file" accept="image/*" capture="environment" onChange={handleReceiptPhoto} />
              </label>

              {receiptImage && <img src={receiptImage} alt="Ticket" className="receipt-preview" />}
            </div>

            <button type="submit">Ajouter</button>
          </form>

          <section className="card">
            <h2>Prélèvements mensuels</h2>

            <form onSubmit={addMonthlyDebit}>
              <input placeholder="Nom du prélèvement" value={debitName} onChange={e => setDebitName(e.target.value)} />
              <input type="number" placeholder="Montant" value={debitAmount} onChange={e => setDebitAmount(e.target.value)} />
              <input type="number" placeholder="Jour du mois" value={debitDay} onChange={e => setDebitDay(e.target.value)} />
              <button type="submit">Ajouter le prélèvement</button>
            </form>

            <div className="debit-list">
              {sortedMonthlyDebits.length === 0 ? <p>Aucun prélèvement mensuel.</p> : sortedMonthlyDebits.map(debit => (
                <div className={isDebitPassed(debit.day, selectedMonth) ? 'debit passed' : 'debit'} key={debit.id}>
                  <div className="debit-day">{debit.day}</div>
                  <div className="debit-info">
                    <strong>{debit.name}</strong>
                    <small>{isDebitPassed(debit.day, selectedMonth) ? 'Effectué' : 'À venir'}</small>
                  </div>
                  <span>-{Number(debit.amount).toFixed(2)} €</span>
                  <button type="button" onClick={() => setMonthlyDebits(monthlyDebits.filter(d => d.id !== debit.id))}>×</button>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {activeTab === 'tickets' && (
        <section className="card">
          <h2>Tickets enregistrés</h2>

          {tickets.length === 0 ? (
            <p>Aucun ticket enregistré.</p>
          ) : (
            tickets.map(t => (
              <div className="ticket-card" key={t.id} onClick={() => setSelectedTicket(t)}>
                <img src={t.receiptImage} alt="Ticket" />
                <div>
                  <strong>{t.reference}</strong>
                  <small>{t.date}</small>
                  <span className="payment">-{Number(t.amount).toFixed(2)} €</span>
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {selectedTicket && (
        <div className="modal" onClick={() => setSelectedTicket(null)}>
          <div className="modal-content">
            <img src={selectedTicket.receiptImage} alt="Ticket agrandi" />
            <button type="button" onClick={() => setSelectedTicket(null)}>Fermer</button>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <>
          <section className="card">
            <h2>Mes catégories</h2>

            <h3>Dépenses</h3>
            <div className="ref-add">
              <input placeholder="Nouvelle catégorie dépense" value={newPaymentRef} onChange={e => setNewPaymentRef(e.target.value)} />
              <button type="button" onClick={addPaymentRef}>Ajouter</button>
            </div>

            <div className="refs">
              {paymentRefs.map(ref => (
                <span key={ref}>
                  {ref}
                  <button type="button" onClick={() => setPaymentRefs(paymentRefs.filter(r => r !== ref))}>×</button>
                </span>
              ))}
            </div>

            <h3>Revenus</h3>
            <div className="ref-add">
              <input placeholder="Nouvelle catégorie revenu" value={newIncomeRef} onChange={e => setNewIncomeRef(e.target.value)} />
              <button type="button" onClick={addIncomeRef}>Ajouter</button>
            </div>

            <div className="refs">
              {incomeRefs.map(ref => (
                <span key={ref}>
                  {ref}
                  <button type="button" onClick={() => setIncomeRefs(incomeRefs.filter(r => r !== ref))}>×</button>
                </span>
              ))}
            </div>
          </section>

          <section className="card">
            <h2>Sauvegarde</h2>

            <p className="backup-info">
              {lastBackup ? `Dernière sauvegarde : ${lastBackup}` : 'Aucune sauvegarde effectuée.'}
            </p>

            <button type="button" onClick={exportJson}>📤 Exporter sauvegarde complète</button>

            <label className="import-label">
              📥 Importer une sauvegarde
              <input className="import-input" type="file" accept="application/json" onChange={importJson} />
            </label>

            <button type="button" onClick={exportCsv}>Exporter CSV</button>
          </section>
        </>
      )}

      <nav className="bottom-nav">
        <button type="button" className={activeTab === 'home' ? 'nav-active' : ''} onClick={() => setActiveTab('home')}>🏠<br />Accueil</button>
        <button type="button" className={activeTab === 'stats' ? 'nav-active' : ''} onClick={() => setActiveTab('stats')}>📊<br />Stats</button>
        <button type="button" className="main-plus" onClick={() => setActiveTab('add')}>+</button>
        <button type="button" className={activeTab === 'budgets' ? 'nav-active' : ''} onClick={() => setActiveTab('budgets')}>💰<br />Budgets</button>
        <button type="button" className={activeTab === 'settings' ? 'nav-active' : ''} onClick={() => setActiveTab('settings')}>⚙️<br />Réglages</button>
      </nav>
    </div>
  );
}
