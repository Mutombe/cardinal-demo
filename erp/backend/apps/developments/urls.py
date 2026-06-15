from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    DeveloperViewSet, DevelopmentProjectViewSet, StandViewSet, BuyerViewSet,
    AgencyViewSet, SalesAgentViewSet, OwnershipProfileViewSet, PurchaseAgreementViewSet,
    InstallmentViewSet, StandPaymentViewSet, DevelopmentDashboardView, InquiryViewSet,
    PublicAvailabilityView,
)

router = DefaultRouter()
router.register(r'developers', DeveloperViewSet)
router.register(r'projects', DevelopmentProjectViewSet)
router.register(r'stands', StandViewSet)
router.register(r'buyers', BuyerViewSet)
router.register(r'agencies', AgencyViewSet)
router.register(r'agents', SalesAgentViewSet)
router.register(r'ownership-profiles', OwnershipProfileViewSet)
router.register(r'agreements', PurchaseAgreementViewSet)
router.register(r'installments', InstallmentViewSet)
router.register(r'payments', StandPaymentViewSet)
router.register(r'inquiries', InquiryViewSet)

urlpatterns = [
    path('dashboard/', DevelopmentDashboardView.as_view(), name='development-dashboard'),
    path('public/availability/', PublicAvailabilityView.as_view(), name='public-availability'),
] + router.urls
