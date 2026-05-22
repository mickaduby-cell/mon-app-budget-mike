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

export default function App() {
  const [transactions, setTransactions] = useState(() => JSON.parse(localStorage.getItem('transactions')) || []);
  const [paymentRefs, setPaymentRefs] = useState(() => JSON.parse(localStorage.getItem('paymentRefs')) || defaultPaymentRefs);
  const [incomeRefs, setIncomeRefs] = useState(() => JSON.parse(localStorage.getItem('incomeRefs')) || defaultIncomeRefs);
  const [monthlyDebits, setMonthlyDebits] = useState(() => JSON.parse(localStorage.getItem('monthlyDebits')) || []);
  const [budgets, setBudgets] = useState(() => JSON.parse(localStorage.getItem('budgets')) || []);

  const [type, setType] = useState('paiement');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(todayFr());

  const [newPaymentRef, setNewPaymentRef] = useState('');
  const [newIncomeRef, setNewIncomeRef] = useState('');

  const [debitName, setDebitName] = useState('');
  const [debitAmount, setDebitAmount] = useState('');
  const [debitDay, setDebitDay] = useState('');

  const [budgetRef, setBudgetRef] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');

  const [receiptImage, setReceiptImage] = useState('');
  const [receiptText, setReceiptText] = useState('');
  const [isReadingReceipt, setIsReadingReceipt] = useState(false);

  useEffect(() => localStorage.setItem('transactions', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('paymentRefs', JSON.stringify(paymentRefs)), [paymentRefs]);
  useEffect(() => localStorage.setItem('incomeRefs', JSON.stringify(incomeRefs)), [incomeRefs]);
  useEffect(() => localStorage.setItem('monthlyDebits', JSON.stringify(monthlyDebits)), [monthlyDebits]);
  useEffect(() => localStorage.setItem('budgets', JSON.stringify(budgets)), [budgets]);

  const sortedMonthlyDebits = [...monthlyDebits].sort((a, b) => Number(a.day) - Number(b.day));

  const totalIncome = transactions
    .filter((t) => t.type === 'revenu')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalPayment = transactions
    .filter((t) => t.type === 'paiement')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const passedDebits = monthlyDebits.filter((d) => isDebitPassed(d.day));

  const totalPassedDebits = passedDebits.reduce(
    (sum, d) => sum + Number(d.amount),
    0
  );

  const realBalance = totalIncome - totalPayment;
  const displayedBalance = realBalance - totalPassedDebits;

  const refsToUse = type === 'paiement' ? paymentRefs : incomeRefs;

  const budgetAlerts = useMemo(() => {
    return budgets
      .map((budget) => {
        const spent = transactions
          .filter((t) => t.type === 'paiement' && t.reference === budget.ref)
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const percent = (spent / Number(budget.amount)) * 100;

        return { ...budget, spent, percent };
      })
      .filter((b) => b.percent >= 80);
  }, [budgets, transactions]);

  function addTransaction(e) {
    e.preventDefault();

    if (!amount || !reference || !date) return;

    const newTransaction = {
      id: Date.now(),
      type,
      amount: Number(amount),
      reference,
      date,
      receiptImage,
    };

    setTransactions([newTransaction, ...transactions]);

    setAmount('');
    setReference('');
    setDate(todayFr());
    setReceiptImage('');
    setReceiptText('');
  }

  function deleteTransaction(id) {
    setTransactions(transactions.filter((t) => t.id !== id));
  }

  function addPaymentRef() {
    const value = newPaymentRef.trim();
    if (value && !paymentRefs.includes(value)) {
      setPaymentRefs([...paymentRefs, value]);
    }
    setNewPaymentRef('');
  }

  function addIncomeRef() {
    const value = newIncomeRef.trim();
    if (value && !incomeRefs.includes(value)) {
      setIncomeRefs([...incomeRefs, value]);
    }
    setNewIncomeRef('');
  }

  function addMonthlyDebit(e) {
    e.preventDefault();

    if (!debitName || !debitAmount || !debitDay) return;
    if (Number(debitDay) < 1 || Number(debitDay) > 31) return;

    const newDebit = {
      id: Date.now(),
      name: debitName,
      amount: Number(debitAmount),
      day: Number(debitDay),
    };

    setMonthlyDebits([...monthlyDebits, newDebit]);

    setDebitName('');
    setDebitAmount('');
    setDebitDay('');
  }

  function addBudget(e) {
    e.preventDefault();

    if (!budgetRef || !budgetAmount) return;

    const existing = budgets.find((b) => b.ref === budgetRef);

    if (existing) {
      setBudgets(
        budgets.map((b) =>
          b.ref === budgetRef ? { ...b, amount: Number(budgetAmount) } : b
        )
      );
    } else {
      setBudgets([
        ...budgets,
        {
          id: Date.now(),
          ref: budgetRef,
          amount: Number(budgetAmount),
        },
      ]);
    }

    setBudgetRef('');
    setBudgetAmount('');
  }

  function handleReceiptPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setReceiptImage(reader.result);
      setReceiptText('');
    };

    reader.readAsDataURL(file);
  }

  function extractReceiptData(text) {
    const lower = text.toLowerCase();

    const amounts = [...text.matchAll(/(\d+[,.]\d{2})/g)]
      .map((match) => Number(match[1].replace(',', '.')))
      .filter((number) => !isNaN(number));

    const foundAmount = amounts.length ? Math.max(...amounts) : '';

    const dateMatch = text.match(/(\d{2}[\/.-]\d{2}[\/.-]\d{2,4})/);

    const foundDate = dateMatch
      ? dateMatch[1].replaceAll('-', '/').replaceAll('.', '/')
      : todayFr();

    let foundRef = 'Courses';

    if (lower.includes('carburant') || lower.includes('gazole') || lower.includes('essence')) {
      foundRef = 'Essence';
    } else if (lower.includes('pharmacie')) {
      foundRef = 'Santé';
    } else if (lower.includes('restaurant') || lower.includes('burger') || lower.includes('pizza')) {
      foundRef = 'Restaurant';
    } else if (lower.includes('brico') || lower.includes('leroy') || lower.includes('castorama')) {
      foundRef = 'Bricolage';
    }

    if (!paymentRefs.includes(foundRef)) {
      setPaymentRefs([...paymentRefs, foundRef]);
    }

    setType('paiement');
    setAmount(foundAmount);
    setReference(foundRef);
    setDate(foundDate);
  }

  async function analyzeReceipt() {
    if (!receiptImage) return;

    setIsReadingReceipt(true);

    try {
      const worker = await createWorker('fra');
      const result = await worker.recognize(receiptImage);
      await worker.terminate();

      const text = result.data.text;

      setReceiptText(text);
      extractReceiptData(text);
    } catch (error) {
      alert('Impossible de lire le ticket. Essaie avec une photo plus nette.');
    }

    setIsReadingReceipt(false);
  }

  function exportJson() {
    const data = {
      transactions,
      paymentRefs,
      incomeRefs,
      monthlyDebits,
      budgets,
    };

    downloadFile(
      'mon-budget-sauvegarde.json',
      JSON.stringify(data, null, 2),
      'application/json'
    );
  }

  function exportCsv() {
    const header = 'type;reference;montant;date\n';

    const rows = transactions
      .map((t) => `${t.type};${t.reference};${t.amount};${t.date}`)
      .join('\n');

    downloadFile('mon-budget-transactions.csv', header + rows, 'text/csv');
  }

  return (
    <div className="app">
      <h1>Mon Budget</h1>

      <div className="summary">
        <div>
          <span>Revenus</span>
          <strong className="income">{totalIncome.toFixed(2)} €</strong>
        </div>

        <div>
          <span>Paiements</span>
          <strong className="payment">{totalPayment.toFixed(2)} €</strong>
        </div>

        <div>
          <span>Prélèvements passés</span>
          <strong className="payment">-{totalPassedDebits.toFixed(2)} €</strong>
        </div>

        <div className="big-balance">
          <span>Solde affiché</span>
          <strong className={displayedBalance >= 0 ? 'income' : 'payment'}>
            {displayedBalance.toFixed(2)} €
          </strong>
        </div>
      </div>

      <div className="notifications">
        <h2>Notifications</h2>

        {passedDebits.length === 0 && budgetAlerts.length === 0 && (
          <p>Aucune alerte pour le moment.</p>
        )}

        {passedDebits.map((debit) => (
          <div className="alert debit-alert" key={debit.id}>
            Prélèvement passé : <strong>{debit.name}</strong> -{' '}
            {Number(debit.amount).toFixed(2)} €
          </div>
        ))}

        {budgetAlerts.map((budget) => (
          <div className="alert budget-alert" key={budget.id}>
            Budget presque dépassé : <strong>{budget.ref}</strong> —{' '}
            {budget.spent.toFixed(2)} € / {Number(budget.amount).toFixed(2)} €
          </div>
        ))}
      </div>

      <form className="card" onSubmit={addTransaction}>
        <h2>Ajouter une opération</h2>

        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setReference('');
          }}
        >
          <option value="paiement">Paiement</option>
          <option value="revenu">Revenu</option>
        </select>

        <input
          type="number"
          placeholder="Montant"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <select value={reference} onChange={(e) => setReference(e.target.value)}>
          <option value="">
            {type === 'paiement' ? 'Ajouter une dépense...' : 'Ajouter un revenu...'}
          </option>

          {refsToUse.map((ref) => (
            <option key={ref} value={ref}>
              {ref}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="JJ/MM/AAAA"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <div className="receipt-box">
          <h3>Photo ticket de caisse</h3>

          <label className="receipt-upload-label">
            📸 Prendre une photo du ticket
            <input
              className="receipt-file-input"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleReceiptPhoto}
            />
          </label>

          {receiptImage && (
            <>
              <img
                src={receiptImage}
                alt="Ticket de caisse"
                className="receipt-preview"
              />

              <button
                type="button"
                onClick={analyzeReceipt}
                disabled={isReadingReceipt}
              >
                {isReadingReceipt ? 'Lecture du ticket...' : 'Analyser le ticket'}
              </button>
            </>
          )}

          {receiptText && (
            <p className="receipt-result">
              Ticket lu. Vérifie le montant avant d’ajouter.
            </p>
          )}
        </div>

        <button type="submit">Ajouter</button>
      </form>

      <div className="card">
        <h2>Prélèvements mensuels</h2>

        <form onSubmit={addMonthlyDebit}>
          <input
            placeholder="Nom du prélèvement"
            value={debitName}
            onChange={(e) => setDebitName(e.target.value)}
          />

          <input
            type="number"
            placeholder="Montant"
            value={debitAmount}
            onChange={(e) => setDebitAmount(e.target.value)}
          />

          <input
            type="number"
            placeholder="Jour du mois"
            value={debitDay}
            onChange={(e) => setDebitDay(e.target.value)}
          />

          <button type="submit">Ajouter le prélèvement</button>
        </form>

        <div className="debit-list">
          {sortedMonthlyDebits.length === 0 ? (
            <p>Aucun prélèvement mensuel.</p>
          ) : (
            sortedMonthlyDebits.map((debit) => (
              <div
                className={isDebitPassed(debit.day) ? 'debit passed' : 'debit'}
                key={debit.id}
              >
                <div className="debit-day">{debit.day}</div>

                <div className="debit-info">
                  <strong>{debit.name}</strong>
                  <small>Chaque mois</small>
                </div>

                <span>-{Number(debit.amount).toFixed(2)} €</span>

                <button
                  type="button"
                  onClick={() =>
                    setMonthlyDebits(
                      monthlyDebits.filter((item) => item.id !== debit.id)
                    )
                  }
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <h2>Budgets par référence</h2>

        <form onSubmit={addBudget}>
          <select
            value={budgetRef}
            onChange={(e) => setBudgetRef(e.target.value)}
          >
            <option value="">Choisir une dépense...</option>

            {paymentRefs.map((ref) => (
              <option key={ref} value={ref}>
                {ref}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Budget max"
            value={budgetAmount}
            onChange={(e) => setBudgetAmount(e.target.value)}
          />

          <button type="submit">Ajouter / modifier budget</button>
        </form>

        {budgets.map((budget) => {
          const spent = transactions
            .filter(
              (transaction) =>
                transaction.type === 'paiement' &&
                transaction.reference === budget.ref
            )
            .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

          const percent = Math.min(
            (spent / Number(budget.amount)) * 100,
            100
          );

          return (
            <div className="budget-row" key={budget.id}>
              <div>
                <strong>{budget.ref}</strong>
                <small>
                  {spent.toFixed(2)} € / {Number(budget.amount).toFixed(2)} €
                </small>

                <div className="bar">
                  <div style={{ width: `${percent}%` }}></div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setBudgets(budgets.filter((item) => item.id !== budget.id))
                }
              >
                Supprimer
              </button>
            </div>
          );
        })}
      </div>

      <div className="card">
        <h2>Sauvegarde / Export</h2>
        <button type="button" onClick={exportJson}>
          Exporter sauvegarde complète
        </button>
        <button type="button" onClick={exportCsv}>
          Exporter transactions CSV
        </button>
      </div>

      <div className="card">
        <h2>Mes références</h2>

        <h3>Paiements</h3>

        <div className="ref-add">
          <input
            placeholder="Nouvelle référence paiement"
            value={newPaymentRef}
            onChange={(e) => setNewPaymentRef(e.target.value)}
          />

          <button type="button" onClick={addPaymentRef}>
            Ajouter
          </button>
        </div>

        <div className="refs">
          {paymentRefs.map((ref) => (
            <span key={ref}>
              {ref}
              <button
                type="button"
                onClick={() =>
                  setPaymentRefs(paymentRefs.filter((item) => item !== ref))
                }
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <h3>Revenus</h3>

        <div className="ref-add">
          <input
            placeholder="Nouvelle référence revenu"
            value={newIncomeRef}
            onChange={(e) => setNewIncomeRef(e.target.value)}
          />

          <button type="button" onClick={addIncomeRef}>
            Ajouter
          </button>
        </div>

        <div className="refs">
          {incomeRefs.map((ref) => (
            <span key={ref}>
              {ref}
              <button
                type="button"
                onClick={() =>
                  setIncomeRefs(incomeRefs.filter((item) => item !== ref))
                }
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Historique</h2>

        {transactions.length === 0 ? (
          <p>Aucune opération.</p>
        ) : (
          transactions.map((transaction) => (
            <div className="transaction" key={transaction.id}>
              <div>
                <strong>{transaction.reference}</strong>
                <small>{transaction.date}</small>
                {transaction.receiptImage && <small>Ticket enregistré</small>}
              </div>

              <span
                className={
                  transaction.type === 'revenu' ? 'income' : 'payment'
                }
              >
                {transaction.type === 'revenu' ? '+' : '-'}
                {Number(transaction.amount).toFixed(2)} €
              </span>

              <button
                type="button"
                onClick={() => deleteTransaction(transaction.id)}
              >
                Supprimer
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
