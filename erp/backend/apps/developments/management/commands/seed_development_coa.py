"""Seed the chart of accounts for Cardinal's land-development trust accounting.

Idempotent: safe to run repeatedly. Aligns the GL to the development domain
(§5 of the transformation brief) — stand sales revenue, reservation fees,
sale commission, and the development cost categories — and relabels any
inherited rental "Landlord Trust" account to "Developer Proceeds Payable".
"""
from django.core.management.base import BaseCommand
from django.db import transaction


# code, name, account_type, account_subtype
DEVELOPMENT_ACCOUNTS = [
    # Assets
    ('1100', 'Bank', 'asset', 'cash'),
    ('1200', 'Buyer Receivables', 'asset', 'accounts_receivable'),
    # Liabilities
    ('2300', 'Developer Proceeds Payable', 'liability', 'funds_held_in_trust'),
    ('2400', 'Buyer Deposits Held', 'liability', 'tenant_deposits'),
    # Revenue
    ('4200', 'Stand Sales Revenue', 'revenue', 'other_income'),
    ('4210', 'Reservation Fees', 'revenue', 'other_income'),
    ('4220', 'Commission on Sales', 'revenue', 'commission_income'),
    # Development cost expense categories
    ('5100', 'Site Acquisition', 'expense', 'operating_expense'),
    ('5200', 'Site Servicing (Roads, Water, Sewer)', 'expense', 'operating_expense'),
    ('5300', 'Construction & Development', 'expense', 'operating_expense'),
    ('5400', 'Legal & Registration', 'expense', 'operating_expense'),
    ('5500', 'Marketing & Sales Commission', 'expense', 'operating_expense'),
]


class Command(BaseCommand):
    help = "Seed/align the chart of accounts for land-development trust accounting."

    @transaction.atomic
    def handle(self, *args, **options):
        from apps.accounting.models import ChartOfAccount

        created, existing = 0, 0
        for code, name, atype, subtype in DEVELOPMENT_ACCOUNTS:
            obj, was_created = ChartOfAccount.objects.get_or_create(
                code=code,
                defaults=dict(name=name, account_type=atype, account_subtype=subtype, is_system=True),
            )
            if was_created:
                created += 1
            else:
                # Keep names/labels aligned to the development domain.
                if obj.name != name:
                    obj.name = name
                    obj.save(update_fields=['name'])
                existing += 1

        # Relabel any inherited rental "Landlord Trust" account.
        relabelled = 0
        for acct in ChartOfAccount.objects.filter(name__icontains='Landlord Trust'):
            acct.name = acct.name.replace('Landlord Trust', 'Developer Proceeds')
            acct.save(update_fields=['name'])
            relabelled += 1

        self.stdout.write(self.style.SUCCESS(
            f"Development CoA seeded: {created} created, {existing} aligned, {relabelled} relabelled."
        ))
