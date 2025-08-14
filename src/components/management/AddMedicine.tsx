
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Search, Plus, Edit2, Eye, IndianRupee } from 'lucide-react';

// Types
interface MedicineTransaction {
  id: string;
  name: string;
  category: string;
  supplier: string;
  quantity: number;
  rate: number;
  status: 'Pending' | 'Completed' | 'Cancelled';
  paymentType: string;
  createdAt: string;
}

interface SettlementRecord {
  amount: number;
  date: string;
  paymentType: string;
}

// Helper functions
const formatCurrency = (amount: number) =>
  `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusOptions = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
];
const paymentTypeOptions = [
  { value: 'Cash', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'Bank Transfer', label: 'Bank Transfer' },
  { value: 'Card', label: 'Card' },
];

// Category Dropdown
const CategoryDropdown: React.FC<{ value: string; onValueChange: (value: string) => void }> = ({ value, onValueChange }) => {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    const stored = localStorage.getItem('medicineCategories');
    if (stored) setCategories(JSON.parse(stored));
  }, []);
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="border-primary/30 focus:border-primary">
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        {categories.map((cat) => (
          <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// Supplier Dropdown
const SupplierDropdown: React.FC<{ value: string; onValueChange: (value: string) => void }> = ({ value, onValueChange }) => {
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    const stored = localStorage.getItem('suppliers');
    if (stored) setSuppliers(JSON.parse(stored));
  }, []);
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="border-primary/30 focus:border-primary">
        <SelectValue placeholder="Select supplier" />
      </SelectTrigger>
      <SelectContent>
        {suppliers.map((sup) => (
          <SelectItem key={sup.id} value={sup.name}>{sup.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const AddMedicine: React.FC = () => {
  // State
  const [transactions, setTransactions] = useState<MedicineTransaction[]>([]);
  const [settlements, setSettlements] = useState<{ [id: string]: number }>({});
  const [settlementHistory, setSettlementHistory] = useState<{ [id: string]: SettlementRecord[] }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showEdit, setShowEdit] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editTx, setEditTx] = useState<MedicineTransaction | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editPaymentType, setEditPaymentType] = useState('');
  const [editStatus, setEditStatus] = useState<'Pending' | 'Completed' | 'Cancelled'>('Pending');
  const [editAmount, setEditAmount] = useState('');
  const [editSettlement, setEditSettlement] = useState(0);
  const [editBalance, setEditBalance] = useState(0);
  const [historyTx, setHistoryTx] = useState<MedicineTransaction | null>(null);

  // Add/Edit form state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<MedicineTransaction>>({});

  // Load from localStorage
  useEffect(() => {
    const tx = JSON.parse(localStorage.getItem('medicineTransactions') || '[]');
    setTransactions(tx);
    setSettlements(JSON.parse(localStorage.getItem('medicineSettlements') || '{}'));
    setSettlementHistory(JSON.parse(localStorage.getItem('medicineSettlementHistory') || '{}'));
  }, []);

  // Save to localStorage
  const saveAll = (tx: MedicineTransaction[], st: any, sh: any) => {
    localStorage.setItem('medicineTransactions', JSON.stringify(tx));
    localStorage.setItem('medicineSettlements', JSON.stringify(st));
    localStorage.setItem('medicineSettlementHistory', JSON.stringify(sh));
    setTransactions([...tx]);
    setSettlements({ ...st });
    setSettlementHistory({ ...sh });
  };

  // Summary cards
  const totalPurchase = transactions.reduce((sum, t) => sum + t.quantity * t.rate, 0);
  const totalSettlement = transactions.reduce((sum, t) => sum + (settlements[t.id] || 0), 0);
  const totalBalance = totalPurchase - totalSettlement;

  // Filtered transactions
  const filteredTx = transactions.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Add/Edit transaction
  const handleAddOrEdit = () => {
    if (!formData.name || !formData.category || !formData.supplier || !formData.quantity || !formData.rate) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    const isEdit = !!formData.id;
    let txArr = [...transactions];
    let tx: MedicineTransaction;
    if (isEdit) {
      txArr = txArr.map(t => t.id === formData.id ? { ...t, ...formData, quantity: Number(formData.quantity), rate: Number(formData.rate) } : t);
      tx = txArr.find(t => t.id === formData.id)!;
    } else {
      const id = `MEDTX${Date.now()}`;
      tx = {
        id,
        name: formData.name!,
        category: formData.category!,
        supplier: formData.supplier!,
        quantity: Number(formData.quantity),
        rate: Number(formData.rate),
        status: 'Pending',
        paymentType: '',
        createdAt: new Date().toISOString().slice(0, 10),
      };
      txArr.push(tx);
    }
    saveAll(txArr, settlements, settlementHistory);
    setShowAddDialog(false);
    setFormData({});
    toast({ title: isEdit ? 'Updated' : 'Added', description: `Medicine ${isEdit ? 'updated' : 'added'} successfully` });
  };

  // Edit modal open
  const openEdit = (tx: MedicineTransaction) => {
    setEditTx(tx);
    setEditDate(tx.createdAt);
    setEditPaymentType(tx.paymentType || '');
    setEditStatus(tx.status);
    setEditAmount('');
    const st = settlements[tx.id] || 0;
    setEditSettlement(st);
    setEditBalance(tx.quantity * tx.rate - st);
    setShowEdit(true);
  };

  // Edit modal save
  const handleEditSave = () => {
    if (!editTx) return;
    let txArr = [...transactions];
    let st = { ...settlements };
    let sh = { ...settlementHistory };
    // Update transaction fields
    txArr = txArr.map(t => t.id === editTx.id ? { ...t, createdAt: editDate, paymentType: editPaymentType, status: editStatus } : t);
    // Add payment
    let addAmt = Number(editAmount);
    if (isNaN(addAmt) || addAmt < 0) addAmt = 0;
    const purchaseAmt = editTx.quantity * editTx.rate;
    let prevSettle = st[editTx.id] || 0;
    let newSettle = prevSettle + addAmt;
    if (newSettle > purchaseAmt) newSettle = purchaseAmt;
    st[editTx.id] = newSettle;
    // Save payment history
    if (!sh[editTx.id]) sh[editTx.id] = [];
    if (addAmt > 0) {
      sh[editTx.id].push({ amount: addAmt, date: editDate, paymentType: editPaymentType });
    }
    saveAll(txArr, st, sh);
    setShowEdit(false);
    toast({ title: 'Updated', description: 'Transaction updated successfully' });
  };

  // Edit modal: update settlement and balance live
  const handleEditAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^\d.]/g, '');
    let num = Number(value);
    if (isNaN(num) || num < 0) num = 0;
    if (!editTx) return;
    const purchaseAmt = editTx.quantity * editTx.rate;
    const prevSettle = settlements[editTx.id] || 0;
    let max = purchaseAmt - prevSettle;
    if (num > max) {
      toast({ title: 'Error', description: 'Amount cannot exceed balance', variant: 'destructive' });
      num = max;
    }
    setEditAmount(num.toString());
    setEditSettlement(prevSettle + num);
    setEditBalance(purchaseAmt - (prevSettle + num));
  };

  // View history modal
  const openHistory = (tx: MedicineTransaction) => {
    setHistoryTx(tx);
    setShowHistory(true);
  };
  const handleDeleteHistory = (idx: number) => {
    if (!historyTx) return;
    if (!window.confirm('Delete this payment record?')) return;
    let sh = { ...settlementHistory };
    let st = { ...settlements };
    sh[historyTx.id].splice(idx, 1);
    // Recalculate settlement
    const totalPaid = sh[historyTx.id].reduce((sum, s) => sum + Number(s.amount), 0);
    st[historyTx.id] = totalPaid;
    saveAll(transactions, st, sh);
    toast({ title: 'Deleted', description: 'Payment record deleted' });
  };

  // Status badge
  const getStatusBadge = (status: string) => {
    const variants: any = {
      'Pending': 'bg-warning text-warning-foreground',
      'Completed': 'bg-success text-success-foreground',
      'Cancelled': 'bg-destructive text-destructive-foreground',
    };
    return variants[status] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="p-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center gap-2">
            <IndianRupee className="w-6 h-6 text-primary" />
            <CardTitle className="text-lg">Purchase Amount</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatCurrency(totalPurchase)}</CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center gap-2">
            <IndianRupee className="w-6 h-6 text-green-600" />
            <CardTitle className="text-lg">Settlement Amount</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatCurrency(totalSettlement)}</CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center gap-2">
            <IndianRupee className="w-6 h-6 text-yellow-600" />
            <CardTitle className="text-lg">Balance Amount</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatCurrency(totalBalance)}</CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by product or supplier..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="w-full md:w-1/4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="border-primary/30 focus:border-primary">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {statusOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 text-right">
          <Button onClick={() => { setShowAddDialog(true); setFormData({}); }} className="bg-gradient-medical">
            <Plus className="w-4 h-4 mr-2" /> Add Medicine
          </Button>
        </div>
      </div>

      {/* Transaction Table */}
      <Card className="shadow-card">
        <CardHeader>
          {/* <CardTitle>Medicine Purchase Transactions</CardTitle> */}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S NO</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Purchase Amount</TableHead>
                  <TableHead>Settlement Amount</TableHead>
                  <TableHead>Balance Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Type</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTx.map((t, idx) => {
                  const purchaseAmt = t.quantity * t.rate;
                  const settleAmt = settlements[t.id] || 0;
                  const balanceAmt = purchaseAmt - settleAmt;
                  return (
                    <TableRow key={t.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>{t.category}</TableCell>
                      <TableCell>{t.supplier}</TableCell>
                      <TableCell>{t.quantity}</TableCell>
                      <TableCell>{formatCurrency(t.rate)}</TableCell>
                      <TableCell>{formatCurrency(purchaseAmt)}</TableCell>
                      <TableCell>{formatCurrency(settleAmt)}</TableCell>
                      <TableCell>{formatCurrency(balanceAmt)}</TableCell>
                      <TableCell><Badge className={getStatusBadge(t.status)}>{t.status.charAt(0).toUpperCase() + t.status.slice(1)}</Badge></TableCell>
                      <TableCell>{t.paymentType || '-'}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline" onClick={() => openEdit(t)} className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-400 action-btn-edit rounded-lg transition-all duration-300"><Edit2 className="w-4 h-4" /></Button>
                          <Button size="sm" variant="outline" onClick={() => openHistory(t)} className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 hover:border-green-400 action-btn-view rounded-lg transition-all duration-300"><Eye className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{formData.id ? 'Edit Medicine Transaction' : 'Add Medicine Transaction'}</DialogTitle>
            <DialogDescription>
              {formData.id ? 'Update transaction details' : 'Enter new medicine purchase details'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Product Name *</Label>
              <Input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Enter product name" />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <CategoryDropdown value={formData.category || ''} onValueChange={v => setFormData({ ...formData, category: v })} />
            </div>
            <div className="space-y-2">
              <Label>Supplier *</Label>
              <SupplierDropdown value={formData.supplier || ''} onValueChange={v => setFormData({ ...formData, supplier: v })} />
            </div>
            <div className="space-y-2">
              <Label>Quantity *</Label>
              <Input type="number" value={formData.quantity || ''} onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })} placeholder="Enter quantity" />
            </div>
            <div className="space-y-2">
              <Label>Rate *</Label>
              <Input value={formData.rate || ''} onChange={e => setFormData({ ...formData, rate: Number(e.target.value) })} placeholder="Enter rate" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddOrEdit} className="bg-primary hover:bg-primary/90">{formData.id ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          {editTx && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Payment Type</Label>
                  <Select value={editPaymentType} onValueChange={setEditPaymentType}>
                    <SelectTrigger className="border-primary/30 focus:border-primary">
                      <SelectValue placeholder="Select payment type" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentTypeOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editStatus} onValueChange={v => setEditStatus(v as any)}>
                    <SelectTrigger className="border-primary/30 focus:border-primary">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Add Payment</Label>
                  <Input value={editAmount} onChange={handleEditAmountChange} placeholder="Enter amount to settle" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Purchase Amount</Label>
                  <div className="font-bold">{formatCurrency(editTx.quantity * editTx.rate)}</div>
                </div>
                <div>
                  <Label>Settlement Amount</Label>
                  <div className="font-bold">{formatCurrency(editSettlement)}</div>
                </div>
                <div>
                  <Label>Balance Amount</Label>
                  <div className="font-bold">{formatCurrency(editBalance)}</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleEditSave} className="bg-primary hover:bg-primary/90">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment History</DialogTitle>
          </DialogHeader>
          {historyTx && (
            <div className="py-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Payment Amount</TableHead>
                    <TableHead>Payment Type</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(settlementHistory[historyTx.id] || []).map((s, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{s.date}</TableCell>
                      <TableCell>{formatCurrency(s.amount)}</TableCell>
                      <TableCell>{s.paymentType}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteHistory(idx)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddMedicine;
