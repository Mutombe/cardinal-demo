"""
Property Development domain — the business layer of the Cardinal ERP.

Core object flow:   Development → Stand → Purchase Agreement → (Installments)
Sits on top of the reused accounting engine (apps.accounting). Single-tenant.
"""
import calendar
from datetime import date
from decimal import Decimal
from django.db import models, transaction
from django.conf import settings
from django.utils import timezone

from apps.soft_delete import SoftDeleteModel


def _add_months(d, n=1):
    m = d.month - 1 + n
    y = d.year + m // 12
    m = m % 12 + 1
    return date(y, m, min(d.day, calendar.monthrange(y, m)[1]))


def _next_seq_code(model, prefix, width=4):
    """Sequential code like DEV0001 based on the last row id (single-tenant)."""
    last = model.all_objects.order_by('-id').first()
    nxt = (last.id if last else 0) + 1
    return f"{prefix}{nxt:0{width}d}"


# ---------------------------------------------------------------------------
# Developer  (was: Landlord)
# ---------------------------------------------------------------------------
class Developer(SoftDeleteModel):
    code = models.CharField(max_length=20, unique=True, blank=True)
    name = models.CharField(max_length=255)
    registration_number = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    physical_address = models.TextField(blank=True)
    # Banking
    bank_name = models.CharField(max_length=255, blank=True)
    bank_branch = models.CharField(max_length=255, blank=True)
    account_number = models.CharField(max_length=100, blank=True)
    account_name = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        indexes = [models.Index(fields=['is_active']), models.Index(fields=['name'])]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = _next_seq_code(Developer, 'DEV')
        super().save(*args, **kwargs)


# ---------------------------------------------------------------------------
# Development Project  (was: Property)
# ---------------------------------------------------------------------------
class DevelopmentProject(SoftDeleteModel):
    class Status(models.TextChoices):
        PLANNING = 'planning', 'Planning'
        NOW_SELLING = 'now_selling', 'Now selling'
        SOLD_OUT = 'sold_out', 'Sold out'
        COMPLETED = 'completed', 'Completed'

    code = models.CharField(max_length=20, unique=True, blank=True)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=120, blank=True, help_text='Matches the public website development slug')
    developer = models.ForeignKey(Developer, on_delete=models.PROTECT, related_name='projects')
    location = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=120, blank=True)
    total_stands = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NOW_SELLING)
    launch_date = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['developer', 'is_active']),
            models.Index(fields=['status']),
            models.Index(fields=['slug']),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = _next_seq_code(DevelopmentProject, 'PRJ')
        super().save(*args, **kwargs)

    # Live inventory counts (drives the dashboards)
    def _count(self, status):
        return self.stands.filter(status=status).count()

    @property
    def available_count(self):
        return self._count(Stand.Status.AVAILABLE)

    @property
    def reserved_count(self):
        return self._count(Stand.Status.RESERVED)

    @property
    def sold_count(self):
        return self._count(Stand.Status.SOLD)


# ---------------------------------------------------------------------------
# Stand  (was: Unit)
# ---------------------------------------------------------------------------
class Stand(SoftDeleteModel):
    class Status(models.TextChoices):
        AVAILABLE = 'available', 'Available'
        RESERVED = 'reserved', 'Reserved'
        SOLD = 'sold', 'Sold'
        CANCELLED = 'cancelled', 'Cancelled'
        UNDER_TRANSFER = 'under_transfer', 'Under transfer'

    code = models.CharField(max_length=30, blank=True)
    stand_number = models.CharField(max_length=50)
    project = models.ForeignKey(DevelopmentProject, on_delete=models.CASCADE, related_name='stands')
    size_sqm = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    selling_price = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0'))
    currency = models.CharField(max_length=10, default='USD')
    # Optional surveyed location for the map
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AVAILABLE, db_index=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['project', 'stand_number']
        unique_together = [('project', 'stand_number')]
        indexes = [
            models.Index(fields=['project', 'status']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"Stand {self.stand_number}"

    def save(self, *args, **kwargs):
        if not self.code and self.project_id:
            self.code = f"{self.project.code}-{self.stand_number}"
        super().save(*args, **kwargs)


# ---------------------------------------------------------------------------
# Buyer  (was: RentalTenant)
# ---------------------------------------------------------------------------
class Buyer(SoftDeleteModel):
    code = models.CharField(max_length=20, unique=True, blank=True)
    full_name = models.CharField(max_length=255)
    national_id = models.CharField(max_length=50, blank=True)
    passport_number = models.CharField(max_length=50, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    residential_address = models.TextField(blank=True)
    next_of_kin_name = models.CharField(max_length=255, blank=True)
    next_of_kin_phone = models.CharField(max_length=50, blank=True)
    next_of_kin_relation = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['full_name']
        indexes = [models.Index(fields=['full_name']), models.Index(fields=['national_id'])]

    def __str__(self):
        return self.full_name

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = _next_seq_code(Buyer, 'BUY')
        super().save(*args, **kwargs)


# ---------------------------------------------------------------------------
# Agency + Sales Agent
# ---------------------------------------------------------------------------
class Agency(SoftDeleteModel):
    code = models.CharField(max_length=20, unique=True, blank=True)
    name = models.CharField(max_length=255)
    registration_details = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'),
                                           help_text='Default commission % on sale price')
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = _next_seq_code(Agency, 'AGY')
        super().save(*args, **kwargs)


class SalesAgent(SoftDeleteModel):
    code = models.CharField(max_length=20, unique=True, blank=True)
    name = models.CharField(max_length=255)
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE, related_name='agents')
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = _next_seq_code(SalesAgent, 'AGT')
        super().save(*args, **kwargs)


# ---------------------------------------------------------------------------
# Ownership Profile — flexible 1..N owners with editable %
# ---------------------------------------------------------------------------
class OwnershipProfile(models.Model):
    """A group of one or more owners for a purchase. Joint↔single by adding /
    removing shares — no schema change."""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Ownership #{self.pk}"

    @property
    def total_percentage(self):
        return sum((s.percentage for s in self.shares.all()), Decimal('0'))

    @property
    def is_valid(self):
        return self.total_percentage == Decimal('100')

    @property
    def label(self):
        parts = [f"{s.buyer.full_name} {s.percentage}%" for s in self.shares.all()]
        return " · ".join(parts) if parts else "No owners"


class OwnerShare(models.Model):
    profile = models.ForeignKey(OwnershipProfile, on_delete=models.CASCADE, related_name='shares')
    buyer = models.ForeignKey(Buyer, on_delete=models.PROTECT, related_name='ownerships')
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('100'))
    is_primary = models.BooleanField(default=False)

    class Meta:
        unique_together = [('profile', 'buyer')]
        ordering = ['-is_primary', '-percentage']

    def __str__(self):
        return f"{self.buyer.full_name} — {self.percentage}%"


# ---------------------------------------------------------------------------
# Purchase Agreement — the heart of the platform  (was: LeaseAgreement)
# ---------------------------------------------------------------------------
class PurchaseAgreement(SoftDeleteModel):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        ACTIVE = 'active', 'Active'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'
        DEFAULTED = 'defaulted', 'Defaulted'

    class Frequency(models.TextChoices):
        MONTHLY = 'monthly', 'Monthly'
        QUARTERLY = 'quarterly', 'Quarterly'

    agreement_number = models.CharField(max_length=30, unique=True, blank=True)
    agreement_date = models.DateField(default=timezone.localdate)
    developer = models.ForeignKey(Developer, on_delete=models.PROTECT, related_name='agreements')
    project = models.ForeignKey(DevelopmentProject, on_delete=models.PROTECT, related_name='agreements')
    stand = models.ForeignKey(Stand, on_delete=models.PROTECT, related_name='agreements')
    agency = models.ForeignKey(Agency, on_delete=models.SET_NULL, null=True, blank=True, related_name='agreements')
    agent = models.ForeignKey(SalesAgent, on_delete=models.SET_NULL, null=True, blank=True, related_name='agreements')
    ownership_profile = models.OneToOneField(
        OwnershipProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='agreement'
    )
    # convenience pointer to the primary buyer (ownership_profile holds the full picture)
    buyer = models.ForeignKey(Buyer, on_delete=models.PROTECT, null=True, blank=True, related_name='agreements')

    sale_price = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0'))
    deposit_amount = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0'))
    currency = models.CharField(max_length=10, default='USD')
    installment_term_months = models.PositiveIntegerField(default=0)
    payment_frequency = models.CharField(max_length=12, choices=Frequency.choices, default=Frequency.MONTHLY)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.DRAFT, db_index=True)
    notes = models.TextField(blank=True)
    # GL link: the sale-recognition journal (Dr Buyer Receivable / Cr Stand Sales Revenue) posted on activation
    sale_journal = models.ForeignKey('accounting.Journal', on_delete=models.SET_NULL, null=True, blank=True, related_name='+')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='+')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-agreement_date', '-id']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['project', 'status']),
            models.Index(fields=['stand']),
        ]

    def __str__(self):
        return self.agreement_number or f"Agreement #{self.pk}"

    @property
    def balance(self):
        return (self.sale_price or Decimal('0')) - (self.deposit_amount or Decimal('0'))

    def save(self, *args, **kwargs):
        if not self.agreement_number:
            with transaction.atomic():
                prefix = f"AGR{timezone.now():%Y%m%d}"
                n = PurchaseAgreement.all_objects.filter(agreement_number__startswith=prefix).count() + 1
                self.agreement_number = f"{prefix}{n:04d}"
        super().save(*args, **kwargs)

    @transaction.atomic
    def activate(self, user=None):
        """Sign/activate the agreement → reserve the stand and recognise the sale in the GL."""
        self.status = self.Status.ACTIVE
        self.save(update_fields=['status', 'updated_at'])
        if self.stand_id and self.stand.status == Stand.Status.AVAILABLE:
            self.stand.status = Stand.Status.RESERVED
            self.stand.save(update_fields=['status', 'updated_at'])
        self.post_sale(user)

    @transaction.atomic
    def post_sale(self, user=None):
        """Recognise the stand sale at signing (accrual):
        Dr Buyer Receivable / Cr Stand Sales Revenue for the full sale price.
        Idempotent — only posts once per agreement."""
        from apps.accounting.models import Journal, JournalEntry
        if self.sale_journal_id or not self.sale_price:
            return self.sale_journal
        receivable = _erp_account('1200', 'Buyer Receivables', 'asset', 'accounts_receivable')
        revenue = _erp_account('4200', 'Stand Sales Revenue', 'revenue', 'other_income')
        stand_no = self.stand.stand_number if self.stand_id else ''
        journal = Journal.objects.create(
            journal_type=Journal.JournalType.SALES,
            date=self.agreement_date,
            description=f"Stand sale {self.agreement_number} — Stand {stand_no}",
            currency=self.currency,
        )
        JournalEntry.objects.create(journal=journal, account=receivable, debit_amount=self.sale_price,
                                    description='Buyer receivable on sale', source_type='purchase_agreement', source_id=self.id)
        JournalEntry.objects.create(journal=journal, account=revenue, credit_amount=self.sale_price,
                                    description='Stand sale revenue recognised', source_type='purchase_agreement', source_id=self.id)
        journal.post(user)
        self.sale_journal = journal
        self.save(update_fields=['sale_journal'])
        return journal

    @property
    def total_paid(self):
        agg = self.payments.aggregate(s=models.Sum('amount'))
        return agg['s'] or Decimal('0')

    @transaction.atomic
    def generate_schedule(self):
        """Generate the monthly installment schedule for the financed balance."""
        self.installments.all().delete()
        term = self.installment_term_months or 0
        bal = self.balance
        if term <= 0 or bal <= 0:
            return []
        step = 3 if self.payment_frequency == self.Frequency.QUARTERLY else 1
        per = (bal / term).quantize(Decimal('0.01'))
        items = []
        d = self.agreement_date
        for i in range(1, term + 1):
            d = _add_months(d, step)
            amount = per if i < term else (bal - per * (term - 1))  # last absorbs rounding
            items.append(Installment(agreement=self, number=i, due_date=d, amount=amount))
        Installment.objects.bulk_create(items)
        return items


def _erp_account(code, name, account_type, subtype):
    """Get-or-create a chart-of-accounts entry for the land-sales postings."""
    from apps.accounting.models import ChartOfAccount
    acct, _ = ChartOfAccount.objects.get_or_create(
        code=code,
        defaults=dict(name=name, account_type=account_type, account_subtype=subtype, is_system=True),
    )
    return acct


class Inquiry(models.Model):
    """A lead from the public website — general, development, or stand enquiry.
    Bridges the marketing site to the ERP CRM; staff convert these to agreements."""
    class Kind(models.TextChoices):
        GENERAL = 'general', 'General'
        DEVELOPMENT = 'development', 'Development'
        STAND = 'stand', 'Stand'

    class Status(models.TextChoices):
        NEW = 'new', 'New'
        CONTACTED = 'contacted', 'Contacted'
        QUALIFIED = 'qualified', 'Qualified'
        CONVERTED = 'converted', 'Converted'
        CLOSED = 'closed', 'Closed'

    full_name = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    message = models.TextField(blank=True)
    kind = models.CharField(max_length=15, choices=Kind.choices, default=Kind.GENERAL)
    development_slug = models.CharField(max_length=120, blank=True)
    development_name = models.CharField(max_length=255, blank=True)
    stand_number = models.CharField(max_length=50, blank=True)
    source = models.CharField(max_length=50, default='website')
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.NEW, db_index=True)
    # Optional links once matched / converted
    development = models.ForeignKey(DevelopmentProject, on_delete=models.SET_NULL, null=True, blank=True, related_name='inquiries')
    agreement = models.ForeignKey('PurchaseAgreement', on_delete=models.SET_NULL, null=True, blank=True, related_name='inquiries')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['status']), models.Index(fields=['kind'])]

    def __str__(self):
        return f"{self.full_name} — {self.kind}"


class Installment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PARTIAL = 'partial', 'Partial'
        PAID = 'paid', 'Paid'
        OVERDUE = 'overdue', 'Overdue'

    agreement = models.ForeignKey(PurchaseAgreement, on_delete=models.CASCADE, related_name='installments')
    number = models.PositiveIntegerField()
    due_date = models.DateField()
    amount = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0'))
    amount_paid = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0'))
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)

    class Meta:
        ordering = ['agreement', 'number']
        unique_together = [('agreement', 'number')]

    def __str__(self):
        return f"{self.agreement.agreement_number} · #{self.number}"

    @property
    def outstanding(self):
        return self.amount - self.amount_paid

    def recalc_status(self, save=True):
        if self.amount_paid >= self.amount:
            self.status = self.Status.PAID
        elif self.amount_paid > 0:
            self.status = self.Status.PARTIAL
        elif self.due_date < timezone.localdate():
            self.status = self.Status.OVERDUE
        else:
            self.status = self.Status.PENDING
        if save:
            self.save(update_fields=['status'])


class StandPayment(SoftDeleteModel):
    class Method(models.TextChoices):
        CASH = 'cash', 'Cash'
        BANK_TRANSFER = 'bank_transfer', 'Bank transfer'
        ECOCASH = 'ecocash', 'EcoCash'
        CARD = 'card', 'Card'
        CHEQUE = 'cheque', 'Cheque'

    payment_number = models.CharField(max_length=30, unique=True, blank=True)
    agreement = models.ForeignKey(PurchaseAgreement, on_delete=models.PROTECT, related_name='payments')
    installment = models.ForeignKey(Installment, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    is_deposit = models.BooleanField(default=False)
    date = models.DateField(default=timezone.localdate)
    amount = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0'))
    currency = models.CharField(max_length=10, default='USD')
    method = models.CharField(max_length=15, choices=Method.choices, default=Method.CASH)
    reference = models.CharField(max_length=120, blank=True)
    journal = models.ForeignKey('accounting.Journal', on_delete=models.SET_NULL, null=True, blank=True, related_name='+')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='+')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-id']
        indexes = [models.Index(fields=['agreement']), models.Index(fields=['date'])]

    def __str__(self):
        return self.payment_number or f"Payment #{self.pk}"

    def save(self, *args, **kwargs):
        if not self.payment_number:
            prefix = f"PAY{timezone.now():%Y%m%d}"
            n = StandPayment.all_objects.filter(payment_number__startswith=prefix).count() + 1
            self.payment_number = f"{prefix}{n:04d}"
        super().save(*args, **kwargs)

    @transaction.atomic
    def post_to_ledger(self, user=None):
        """Record the cash receipt in the GL: Dr Bank, Cr Buyer Receivable.
        The sale revenue was already recognised at agreement signing (post_sale),
        so a collection settles the receivable — it is NOT recognised as new revenue.
        Then apply to the installment + roll up the agreement status."""
        from apps.accounting.models import Journal, JournalEntry

        if self.journal_id:
            return self.journal  # already posted

        # Ensure the sale was recognised before applying a collection against it.
        if self.agreement_id and not self.agreement.sale_journal_id:
            self.agreement.post_sale(user)

        bank = _erp_account('1100', 'Bank', 'asset', 'cash')
        receivable = _erp_account('1200', 'Buyer Receivables', 'asset', 'accounts_receivable')

        journal = Journal.objects.create(
            journal_type=Journal.JournalType.RECEIPTS,
            date=self.date,
            description=f"Stand payment {self.payment_number} — {self.agreement.agreement_number}",
            currency=self.currency,
        )
        JournalEntry.objects.create(journal=journal, account=bank, debit_amount=self.amount,
                                    description='Stand payment received', source_type='stand_payment', source_id=self.id)
        JournalEntry.objects.create(journal=journal, account=receivable, credit_amount=self.amount,
                                    description='Applied to buyer receivable', source_type='stand_payment', source_id=self.id)
        journal.post(user)

        self.journal = journal
        self.save(update_fields=['journal'])

        # Apply to installment
        if self.installment_id:
            self.installment.amount_paid = (self.installment.amount_paid or Decimal('0')) + self.amount
            self.installment.save(update_fields=['amount_paid'])
            self.installment.recalc_status()

        # Roll up the agreement: fully paid → completed; first payment → active
        if self.agreement.total_paid >= self.agreement.sale_price and self.agreement.sale_price > 0:
            self.agreement.status = PurchaseAgreement.Status.COMPLETED
            self.agreement.save(update_fields=['status', 'updated_at'])
            if self.agreement.stand_id:
                self.agreement.stand.status = Stand.Status.SOLD
                self.agreement.stand.save(update_fields=['status', 'updated_at'])
        elif self.agreement.status == PurchaseAgreement.Status.DRAFT:
            self.agreement.activate()
        return journal
