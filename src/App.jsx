import { useEffect, useMemo, useState } from 'react';
import './index.css';

const defaultPaymentRefs = ['Courses', 'Essence', 'Crédit', 'Assurance', 'Loisirs'];
const defaultIncomeRefs = ['Salaire', 'CAF', 'Remboursement', 'Vente', 'Autre'];

function todayFr() {
  return new Date().toLocaleDateString('fr-FR');
}

function isDebitPassed(day) {
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
  const [showExpenseDetails, setShowExpenseDetails] = useState(false);

  const [transactions, setTransactions] = useState(() => JSON.parse(localStorage.getItem('transactions')) || []);
  const [paymentRefs, setPaymentRefs] = useState(() => JSON.parse(localStorage.getItem('paymentRefs')) || defaultPaymentRefs);
  const [incomeRefs, setIncomeRefs] = useState(() => JSON.parse(localStorage.getItem('incomeRefs')) || defaultIncomeRefs);
  const [monthlyDebits, setMonthlyDebits] = useState(() => JSON.parse(localStorage.getItem('monthlyDebits')) || []);
  const [budgets, setBudgets] = useState(() => JSON.parse(localStorage.getItem('budgets')) || []);

  const [type, setType] = useState('paiement');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(todayFr());

  const [debitName, setDebitName] = useState('');
  const [debitAmount, setDebitAmount] = useState('');
  const [debitDay, setDebitDay] = useState('');

  const [newPaymentRef, setNewPaymentRef] = useState('');
  const [newIncomeRef, setNewIncomeRef] = useState('');
  const [receiptImage, setReceiptImage] = useState('');

  useEffect(() => localStorage.setItem('transactions', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('paymentRefs', JSON.stringify(paymentRefs)), [paymentRefs]);
  useEffect(() => localStorage.setItem('incomeRefs', JSON.stringify(incomeRefs)), [incomeRefs]);
  useEffect(() => localStorage.setItem('monthlyDebits', JSON.stringify(monthlyDebits)), [monthlyDebits]);
  useEffect(() => localStorage.setItem('budgets', JSON.stringify(budgets)), [budgets]);

  const totalIncome = transactions.filter(t => t.type === 'revenu').reduce((s, t) => s + Number(t.amount), 0);
  const totalPayment = transactions.filter(t => t.type === 'paiement').reduce((s, t) => s + Number(t.amount), 0);

  const passedDebits = monthlyDebits.filter(d => isDebitPassed(d.day));
  const remainingDebits = monthlyDebits.filter(d => !isDebitPassed(d.day));

  const totalPassedDebits = passedDebits.reduce((s, d) => s + Number(d.amount), 0);
  const totalRemainingDebits = remainingDebits.reduce((s, d) => s + Number(d.amount), 0);

  const totalDoneExpenses = totalPayment + totalPassedDebits;
  const balance = totalIncome - totalDoneExpenses;

  const sortedMonthlyDebits = [...monthlyDebits].sort((a, b) => Number(a.day) - Number(b.day));
  const refsToUse = type === 'paiement' ? paymentRefs : incomeRefs;

  const budgetAlerts = useMemo(() => {
    return budgets
      .map(budget => {
        const spent = transactions
          .filter(t => t.type === 'paiement' && t.reference === budget.ref)
          .reduce((s, t) => s + Number(t.amount), 0);

        return { ...budget, spent, percent: (spent / Number(budget.amount)) * 100 };
      })
      .filter(b => b.percent >= 80);
  }, [budgets, transactions]);

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

  function exportJson() {
    const data = { transactions, paymentRefs, incomeRefs, monthlyDebits, budgets };
    downloadFile('mon-budget-sauvegarde.json', JSON.stringify(data, null, 2), 'application/json');
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
          <h1>Mon Budget</h1>
          <p>{activeTab === 'home' ? 'Vue d’ensemble' : activeTab === 'add' ? 'Ajout rapide' : activeTab === 'tickets' ? 'Tickets' : 'Réglages'}</p>
        </div>
        <button className="icon-btn" type="button">🔔</button>
      </header>

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
            <h2>Prélèvements mensuels</h2>

            <form onSubmit={addMonthlyDebit}>
              <input placeholder="Nom du prélèvement" value={debitName} onChange={e => setDebitName(e.target.value)} />
              <input type="number" placeholder="Montant" value={debitAmount} onChange={e => setDebitAmount(e.target.value)} />
              <input type="number" placeholder="Jour du mois" value={debitDay} onChange={e => setDebitDay(e.target.value)} />
              <button type="submit">Ajouter le prélèvement</button>
            </form>

            <div className="debit-list">
              {sortedMonthlyDebits.length === 0 ? <p>Aucun prélèvement mensuel.</p> : sortedMonthlyDebits.map(debit => (
                <div className={isDebitPassed(debit.day) ? 'debit passed' : 'debit'} key={debit.id}>
                  <div className="debit-day">{debit.day}</div>
                  <div className="debit-info">
                    <strong>{debit.name}</strong>
                    <small>{isDebitPassed(debit.day) ? 'Effectué' : 'À venir'}</small>
                  </div>
                  <span>-{Number(debit.amount).toFixed(2)} €</span>
                  <button type="button" onClick={() => setMonthlyDebits(monthlyDebits.filter(d => d.id !== debit.id))}>×</button>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <h2>Historique</h2>
            {transactions.length === 0 ? <p>Aucune opération.</p> : transactions.slice(0, 6).map(t => (
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

      {activeTab === 'add' && (
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
      )}

      {activeTab === 'tickets' && (
        <section className="card">
          <h2>Tickets enregistrés</h2>
          {transactions.filter(t => t.receiptImage).length === 0 ? (
            <p>Aucun ticket enregistré.</p>
          ) : (
            transactions.filter(t => t.receiptImage).map(t => (
              <div className="ticket-card" key={t.id}>
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
            <button type="button" onClick={exportJson}>Exporter sauvegarde complète</button>
            <button type="button" onClick={exportCsv}>Exporter CSV</button>
          </section>
        </>
      )}

      <nav className="bottom-nav">
        <button type="button" className={activeTab === 'home' ? 'nav-active' : ''} onClick={() => setActiveTab('home')}>🏠<br />Accueil</button>
        <button type="button" className={activeTab === 'tickets' ? 'nav-active' : ''} onClick={() => setActiveTab('tickets')}>🎟️<br />Tickets</button>
        <button type="button" className="main-plus" onClick={() => setActiveTab('add')}>+</button>
        <button type="button" className={activeTab === 'settings' ? 'nav-active' : ''} onClick={() => setActiveTab('settings')}>⚙️<br />Réglages</button>
      </nav>
    </div>
  );
}
