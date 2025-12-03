import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonItem, IonLabel, IonList, IonListHeader, IonDatetime, IonDatetimeButton, IonModal } from '@ionic/react';
import { transactionApi } from '../../services/api';
import { useHistory } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface Transaction {
    id: string;
    title: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    date: string;
}

const TransactionsByMonth: React.FC = () => {
    const history = useHistory();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString());
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        const fetchTransactions = async () => {
            const date = new Date(selectedDate);
            const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const data = await transactionApi.getByMonth(monthStr);
            // Sort by date descending
            data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setTransactions(data);
        };
        fetchTransactions();
    }, [selectedDate]);

    const formatAmount = (amount: number) => {
        return amount.toLocaleString('vi-VN') + ' đ';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <button onClick={() => history.goBack()} className="pl-4">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                    </IonButtons>
                    <IonTitle>Monthly Transactions</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <div className="flex justify-center my-4">
                     <IonDatetimeButton datetime="datetime"></IonDatetimeButton>
                     <IonModal keepContentsMounted={true}>
                        <IonDatetime
                            id="datetime"
                            presentation="month-year"
                            value={selectedDate}
                            onIonChange={(e) => setSelectedDate(e.detail.value as string)}
                        ></IonDatetime>
                     </IonModal>
                </div>

                <IonList>
                    {transactions.length === 0 ? (
                        <div className="text-center p-4 text-gray-500">No transactions found for this month.</div>
                    ) : (
                        transactions.map(t => (
                            <IonItem key={t.id} button onClick={() => history.push(`/edit-transaction/${t.id}`)}>
                                <IonLabel>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold">{t.title}</h3>
                                            <p className="text-sm text-gray-500">{t.category} • {formatDate(t.date)}</p>
                                        </div>
                                        <div className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                            {t.type === 'income' ? '+' : '-'}{formatAmount(Math.abs(t.amount))}
                                        </div>
                                    </div>
                                </IonLabel>
                            </IonItem>
                        ))
                    )}
                </IonList>
            </IonContent>
        </IonPage>
    );
};

export default TransactionsByMonth;
