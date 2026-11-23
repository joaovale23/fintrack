import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { CategoryStore } from '../../core/category-store';
import { Category, Transaction } from '../../core/models';
import { TransactionService } from '../../core/transaction.service';
import { TransactionSheet, TransactionSheetData } from './transaction-sheet';

const lazer: Category = {
  id: 'c1',
  name: 'Lazer',
  type: 'EXPENSE',
  color: '#e0457b',
  icon: 'celebration',
  monthlyLimit: 400,
};
const salario: Category = {
  id: 'c2',
  name: 'Salário',
  type: 'INCOME',
  color: '#1f8a5b',
  icon: 'payments',
  monthlyLimit: null,
};

function setup(data: TransactionSheetData) {
  const service = { create: vi.fn(), update: vi.fn(), delete: vi.fn() };
  const ref = { close: vi.fn() };
  const all = [lazer, salario];
  TestBed.configureTestingModule({
    providers: [
      provideNativeDateAdapter(),
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: MatDialogRef, useValue: ref },
      { provide: TransactionService, useValue: service },
      {
        provide: CategoryStore,
        useValue: { all: () => all, incomes: () => [salario], expenses: () => [lazer] },
      },
    ],
  });
  const fixture = TestBed.createComponent(TransactionSheet);
  return { fixture, component: fixture.componentInstance, service, ref };
}

describe('TransactionSheet', () => {
  it('não envia o formulário incompleto', () => {
    const { component, service } = setup({});
    component.save();
    expect(service.create).not.toHaveBeenCalled();
  });

  it('aceita valor em formato brasileiro e grava a data sem fuso', () => {
    const { component, service, ref } = setup({});
    const saved = { id: 't1' } as Transaction;
    service.create.mockReturnValue(of(saved));

    component['form'].patchValue({
      amount: '1.234,5',
      description: '  Show  ',
      date: new Date(2026, 10, 30),
      categoryId: 'c1',
    });
    component.save();

    expect(service.create).toHaveBeenCalledWith({
      description: 'Show',
      amount: 1234.5,
      date: '2026-11-30',
      categoryId: 'c1',
    });
    expect(ref.close).toHaveBeenCalledWith(saved);
  });

  it('trocar para entrada solta a categoria de despesa', () => {
    const { component } = setup({ draft: { categoryId: 'c1' } });
    expect(component['form'].controls.type.value).toBe('EXPENSE');
    component.setType('INCOME');
    expect(component['form'].controls.categoryId.value).toBe('');
  });

  it('na edição, começa preenchido e chama update', () => {
    const transaction: Transaction = {
      id: 't9',
      description: 'Show',
      amount: 120,
      date: '2026-11-12',
      category: lazer,
    };
    const { component, service } = setup({ transaction });
    service.update.mockReturnValue(of(transaction));

    expect(component['form'].getRawValue().amount).toBe('120,00');
    component.save();

    expect(service.update).toHaveBeenCalledWith(
      't9',
      expect.objectContaining({ date: '2026-11-12', amount: 120 }),
    );
  });

  it('mostra só as categorias do tipo escolhido', async () => {
    const { fixture, component } = setup({});
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('.cat')).toHaveLength(1);
    component.setType('INCOME');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.cat')?.textContent).toContain('Salário');
  });
});
