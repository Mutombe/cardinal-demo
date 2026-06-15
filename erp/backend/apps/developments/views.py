from decimal import Decimal
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone

from apps.soft_delete import SoftDeleteMixin
from .models import (
    Developer, DevelopmentProject, Stand, Buyer, Agency, SalesAgent,
    OwnershipProfile, PurchaseAgreement, Installment, StandPayment, Inquiry,
)
from .serializers import (
    DeveloperSerializer, DevelopmentProjectSerializer, StandSerializer,
    BuyerSerializer, AgencySerializer, SalesAgentSerializer,
    OwnershipProfileSerializer, PurchaseAgreementSerializer,
    InstallmentSerializer, StandPaymentSerializer, InquirySerializer,
)


class DeveloperViewSet(SoftDeleteMixin, viewsets.ModelViewSet):
    queryset = Developer.objects.all()
    serializer_class = DeveloperSerializer
    filterset_fields = ['is_active']
    search_fields = ['name', 'code', 'registration_number', 'email']
    ordering_fields = ['name', 'created_at']


class DevelopmentProjectViewSet(SoftDeleteMixin, viewsets.ModelViewSet):
    queryset = DevelopmentProject.objects.select_related('developer').all()
    serializer_class = DevelopmentProjectSerializer
    filterset_fields = ['developer', 'status', 'is_active', 'city']
    search_fields = ['name', 'code', 'location', 'slug']
    ordering_fields = ['name', 'launch_date', 'created_at']


class StandViewSet(SoftDeleteMixin, viewsets.ModelViewSet):
    queryset = Stand.objects.select_related('project').all()
    serializer_class = StandSerializer
    filterset_fields = ['project', 'status', 'currency']
    search_fields = ['stand_number', 'code']
    ordering_fields = ['stand_number', 'selling_price', 'size_sqm', 'created_at']


class BuyerViewSet(SoftDeleteMixin, viewsets.ModelViewSet):
    queryset = Buyer.objects.all()
    serializer_class = BuyerSerializer
    filterset_fields = ['is_active']
    search_fields = ['full_name', 'code', 'national_id', 'passport_number', 'email', 'phone']
    ordering_fields = ['full_name', 'created_at']


class AgencyViewSet(SoftDeleteMixin, viewsets.ModelViewSet):
    queryset = Agency.objects.all()
    serializer_class = AgencySerializer
    filterset_fields = ['is_active']
    search_fields = ['name', 'code', 'email']
    ordering_fields = ['name', 'created_at']


class SalesAgentViewSet(SoftDeleteMixin, viewsets.ModelViewSet):
    queryset = SalesAgent.objects.select_related('agency').all()
    serializer_class = SalesAgentSerializer
    filterset_fields = ['agency', 'is_active']
    search_fields = ['name', 'code', 'email']
    ordering_fields = ['name', 'created_at']


class OwnershipProfileViewSet(viewsets.ModelViewSet):
    queryset = OwnershipProfile.objects.prefetch_related('shares__buyer').all()
    serializer_class = OwnershipProfileSerializer


class PurchaseAgreementViewSet(SoftDeleteMixin, viewsets.ModelViewSet):
    queryset = PurchaseAgreement.objects.select_related(
        'developer', 'project', 'stand', 'agency', 'agent', 'buyer', 'ownership_profile'
    ).all()
    serializer_class = PurchaseAgreementSerializer
    filterset_fields = ['status', 'project', 'developer', 'agency', 'agent', 'stand', 'buyer']
    search_fields = ['agreement_number']
    ordering_fields = ['agreement_date', 'sale_price', 'created_at']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Sign/activate the agreement → reserve the stand + recognise the sale in the GL."""
        agreement = self.get_object()
        agreement.activate(user=request.user if request.user.is_authenticated else None)
        return Response(self.get_serializer(agreement).data)

    @action(detail=True, methods=['post'])
    def generate_schedule(self, request, pk=None):
        """Generate the installment schedule from sale price − deposit ÷ term."""
        agreement = self.get_object()
        agreement.generate_schedule()
        return Response(InstallmentSerializer(agreement.installments.all(), many=True).data)


class InstallmentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Installment.objects.select_related('agreement').all()
    serializer_class = InstallmentSerializer
    filterset_fields = ['agreement', 'status']
    ordering_fields = ['due_date', 'number']


class StandPaymentViewSet(SoftDeleteMixin, viewsets.ModelViewSet):
    queryset = StandPayment.objects.select_related('agreement', 'journal').all()
    serializer_class = StandPaymentSerializer
    filterset_fields = ['agreement', 'method', 'is_deposit']
    search_fields = ['payment_number', 'reference']
    ordering_fields = ['date', 'amount']

    def perform_create(self, serializer):
        payment = serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)
        payment.post_to_ledger(user=self.request.user if self.request.user.is_authenticated else None)


class InquiryViewSet(viewsets.ModelViewSet):
    """Website leads. Public can CREATE (from the marketing site); staff manage the rest."""
    queryset = Inquiry.objects.select_related('development').all()
    serializer_class = InquirySerializer
    filterset_fields = ['status', 'kind']
    search_fields = ['full_name', 'email', 'phone', 'development_name', 'stand_number']
    ordering_fields = ['created_at', 'status']

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        # Public submissions always start as NEW from the website.
        serializer.save(status=Inquiry.Status.NEW, source=serializer.validated_data.get('source') or 'website')


class PublicAvailabilityView(APIView):
    """PUBLIC (no auth) — live stand availability for the marketing website.
    The website's availability map/counts read this, so changing a stand's status
    in the dashboard (reserve/sell) instantly updates what buyers see. This is the
    CMS link: the ERP is the single source of truth for inventory + availability."""
    permission_classes = [AllowAny]

    def get(self, request):
        slug = request.query_params.get('slug')
        qs = DevelopmentProject.objects.all()
        if slug:
            qs = qs.filter(slug=slug)

        out = {}
        for p in qs:
            by = {r['status']: r['n'] for r in p.stands.values('status').annotate(n=Count('id'))}
            total = sum(by.values())
            available = by.get(Stand.Status.AVAILABLE, 0)
            reserved = by.get(Stand.Status.RESERVED, 0)
            sold = by.get(Stand.Status.SOLD, 0)
            entry = {
                'slug': p.slug,
                'name': p.name,
                'location': p.location or p.city,
                'status': p.get_status_display(),
                'total': total,
                'available': available,
                'reserved': reserved,
                'sold': sold,
                # per-stand list (drives the granular availability map)
                'stands': [
                    {
                        'stand_number': s.stand_number,
                        'status': s.status,
                        'size_sqm': float(s.size_sqm) if s.size_sqm is not None else None,
                        'price': float(s.selling_price or 0),
                        'currency': s.currency,
                        'lat': float(s.latitude) if s.latitude is not None else None,
                        'lng': float(s.longitude) if s.longitude is not None else None,
                    }
                    for s in p.stands.all().order_by('stand_number')
                ],
            }
            if p.slug:
                out[p.slug] = entry
        return Response(out)


class DevelopmentDashboardView(APIView):
    """Executive KPIs + operating feed for the land-development portfolio."""

    def get(self, request):
        # --- Stand inventory (portfolio-wide) -------------------------------
        by_status = {
            row['status']: row['n']
            for row in Stand.objects.values('status').annotate(n=Count('id'))
        }
        stand_total = sum(by_status.values())
        sold = by_status.get(Stand.Status.SOLD, 0)
        reserved = by_status.get(Stand.Status.RESERVED, 0)
        available = by_status.get(Stand.Status.AVAILABLE, 0)

        # --- Finance --------------------------------------------------------
        contract_value = PurchaseAgreement.objects.exclude(
            status=PurchaseAgreement.Status.CANCELLED
        ).aggregate(s=Sum('sale_price'))['s'] or Decimal('0')
        collected = StandPayment.objects.aggregate(s=Sum('amount'))['s'] or Decimal('0')
        deposits = StandPayment.objects.filter(is_deposit=True).aggregate(s=Sum('amount'))['s'] or Decimal('0')

        # --- Per-project breakdown (sell-through) ---------------------------
        projects = []
        project_qs = (
            DevelopmentProject.objects.all()
            .annotate(
                n_total=Count('stands'),
                n_available=Count('stands', filter=Q(stands__status=Stand.Status.AVAILABLE)),
                n_reserved=Count('stands', filter=Q(stands__status=Stand.Status.RESERVED)),
                n_sold=Count('stands', filter=Q(stands__status=Stand.Status.SOLD)),
            )
            .order_by('-n_sold', 'name')
        )
        for p in project_qs:
            committed = (p.n_sold or 0) + (p.n_reserved or 0)
            sell_through = round(100 * committed / p.n_total, 1) if p.n_total else 0.0
            projects.append({
                'id': p.id,
                'name': p.name,
                'slug': p.slug,
                'location': p.location or p.city,
                'status': p.status,
                'status_display': p.get_status_display(),
                'stands_total': p.n_total or 0,
                'available': p.n_available or 0,
                'reserved': p.n_reserved or 0,
                'sold': p.n_sold or 0,
                'sell_through': sell_through,
            })

        # --- Sales pipeline (website + manual inquiries by stage) -----------
        pipe = {
            row['status']: row['n']
            for row in Inquiry.objects.values('status').annotate(n=Count('id'))
        }
        pipeline = {
            'total': sum(pipe.values()),
            'new': pipe.get(Inquiry.Status.NEW, 0),
            'contacted': pipe.get(Inquiry.Status.CONTACTED, 0),
            'qualified': pipe.get(Inquiry.Status.QUALIFIED, 0),
            'converted': pipe.get(Inquiry.Status.CONVERTED, 0),
            'closed': pipe.get(Inquiry.Status.CLOSED, 0),
        }

        # --- Recent website leads ------------------------------------------
        recent_inquiries = [{
            'id': i.id,
            'full_name': i.full_name,
            'kind': i.kind,
            'development_name': i.development_name,
            'stand_number': i.stand_number,
            'status': i.status,
            'source': i.source,
            'created_at': i.created_at,
        } for i in Inquiry.objects.order_by('-created_at')[:8]]

        # --- Recent payments (cash actually received) ----------------------
        recent_payments = []
        for pay in StandPayment.objects.select_related('agreement', 'agreement__buyer').order_by('-date', '-id')[:8]:
            agr = pay.agreement
            buyer_name = '—'
            if agr:
                if agr.buyer_id:
                    buyer_name = agr.buyer.full_name
                elif agr.ownership_profile_id:
                    buyer_name = agr.ownership_profile.label
            recent_payments.append({
                'id': pay.id,
                'payment_number': pay.payment_number,
                'amount': pay.amount,
                'currency': pay.currency,
                'date': pay.date,
                'method': pay.method,
                'is_deposit': pay.is_deposit,
                'agreement_number': agr.agreement_number if agr else '',
                'buyer_name': buyer_name,
            })

        # --- 6-month collection trend --------------------------------------
        month_labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        today = timezone.localdate()
        # Build the last 6 calendar months as (year, month) keys in order.
        series_keys = []
        y, m = today.year, today.month
        for _ in range(6):
            series_keys.append((y, m))
            m -= 1
            if m == 0:
                m = 12
                y -= 1
        series_keys.reverse()
        monthly = {
            (row['mo'].year, row['mo'].month): row['s']
            for row in StandPayment.objects
            .annotate(mo=TruncMonth('date'))
            .values('mo')
            .annotate(s=Sum('amount'))
            if row['mo'] is not None
        }
        collection_series = [{
            'month': month_labels[mm - 1],
            'collected': float(monthly.get((yy, mm), 0) or 0),
        } for (yy, mm) in series_keys]

        return Response({
            'projects': {
                'total': DevelopmentProject.objects.count(),
                'now_selling': DevelopmentProject.objects.filter(status=DevelopmentProject.Status.NOW_SELLING).count(),
                'list': projects,
            },
            'stands': {
                'total': stand_total,
                'available': available,
                'reserved': reserved,
                'sold': sold,
                'sell_through': round(100 * (sold + reserved) / stand_total, 1) if stand_total else 0.0,
            },
            'sales': {
                'agreements': PurchaseAgreement.objects.count(),
                'active': PurchaseAgreement.objects.filter(status=PurchaseAgreement.Status.ACTIVE).count(),
                'completed': PurchaseAgreement.objects.filter(status=PurchaseAgreement.Status.COMPLETED).count(),
                'draft': PurchaseAgreement.objects.filter(status=PurchaseAgreement.Status.DRAFT).count(),
            },
            'finance': {
                'contract_value': contract_value,
                'collected': collected,
                'deposits': deposits,
                'outstanding': contract_value - collected,
                'collection_rate': round(100 * float(collected) / float(contract_value), 1) if contract_value else 0.0,
                'buyers': Buyer.objects.count(),
                'agencies': Agency.objects.count(),
                'agents': SalesAgent.objects.count(),
            },
            'pipeline': pipeline,
            'recent_inquiries': recent_inquiries,
            'recent_payments': recent_payments,
            'collection_series': collection_series,
        })
