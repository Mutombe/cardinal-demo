from rest_framework import serializers

from .models import (
    Developer, DevelopmentProject, Stand, Buyer, Agency, SalesAgent,
    OwnershipProfile, OwnerShare, PurchaseAgreement, Installment, StandPayment, Inquiry,
    Phase, PriceStep, ConstructionMilestone, BudgetLine, Contractor, SnagItem,
    TitleTransfer, Reservation, WaitlistEntry,
)


class DeveloperSerializer(serializers.ModelSerializer):
    class Meta:
        model = Developer
        fields = '__all__'
        read_only_fields = ['code', 'created_at', 'updated_at']


class DevelopmentProjectSerializer(serializers.ModelSerializer):
    developer_name = serializers.CharField(source='developer.name', read_only=True)
    available_count = serializers.IntegerField(read_only=True)
    reserved_count = serializers.IntegerField(read_only=True)
    sold_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = DevelopmentProject
        fields = '__all__'
        read_only_fields = ['code', 'created_at', 'updated_at']


class StandSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)

    class Meta:
        model = Stand
        fields = '__all__'
        read_only_fields = ['code', 'created_at', 'updated_at']


class BuyerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Buyer
        fields = '__all__'
        read_only_fields = ['code', 'created_at', 'updated_at']


class AgencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Agency
        fields = '__all__'
        read_only_fields = ['code', 'created_at', 'updated_at']


class SalesAgentSerializer(serializers.ModelSerializer):
    agency_name = serializers.CharField(source='agency.name', read_only=True)

    class Meta:
        model = SalesAgent
        fields = '__all__'
        read_only_fields = ['code', 'created_at', 'updated_at']


class OwnerShareSerializer(serializers.ModelSerializer):
    buyer_name = serializers.CharField(source='buyer.full_name', read_only=True)

    class Meta:
        model = OwnerShare
        fields = ['id', 'buyer', 'buyer_name', 'percentage', 'is_primary']


class OwnershipProfileSerializer(serializers.ModelSerializer):
    shares = OwnerShareSerializer(many=True)
    total_percentage = serializers.DecimalField(max_digits=6, decimal_places=2, read_only=True)
    is_valid = serializers.BooleanField(read_only=True)
    label = serializers.CharField(read_only=True)

    class Meta:
        model = OwnershipProfile
        fields = ['id', 'shares', 'total_percentage', 'is_valid', 'label', 'created_at']

    def create(self, validated_data):
        shares = validated_data.pop('shares', [])
        profile = OwnershipProfile.objects.create()
        for s in shares:
            OwnerShare.objects.create(profile=profile, **s)
        return profile

    def update(self, instance, validated_data):
        shares = validated_data.pop('shares', None)
        if shares is not None:
            # Replace shares wholesale — supports joint↔single edits.
            instance.shares.all().delete()
            for s in shares:
                OwnerShare.objects.create(profile=instance, **s)
        instance.save()
        return instance


class PurchaseAgreementSerializer(serializers.ModelSerializer):
    developer_name = serializers.CharField(source='developer.name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    stand_number = serializers.CharField(source='stand.stand_number', read_only=True)
    agency_name = serializers.CharField(source='agency.name', read_only=True)
    agent_name = serializers.CharField(source='agent.name', read_only=True)
    buyer_name = serializers.CharField(source='buyer.full_name', read_only=True)
    ownership = OwnershipProfileSerializer(source='ownership_profile', read_only=True)
    balance = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = PurchaseAgreement
        fields = '__all__'
        read_only_fields = ['agreement_number', 'created_at', 'updated_at', 'created_by']


class InstallmentSerializer(serializers.ModelSerializer):
    outstanding = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    agreement_number = serializers.CharField(source='agreement.agreement_number', read_only=True)

    class Meta:
        model = Installment
        fields = '__all__'


class StandPaymentSerializer(serializers.ModelSerializer):
    agreement_number = serializers.CharField(source='agreement.agreement_number', read_only=True)
    journal_number = serializers.CharField(source='journal.journal_number', read_only=True)

    class Meta:
        model = StandPayment
        fields = '__all__'
        read_only_fields = ['payment_number', 'journal', 'created_by', 'created_at']


class InquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inquiry
        fields = '__all__'
        read_only_fields = ['created_at']
        # Public submissions only set these; staff manage the rest.
        extra_kwargs = {'status': {'required': False}, 'source': {'required': False}}


# --- Developer lifecycle extensions ---------------------------------------
class PriceStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceStep
        fields = '__all__'


class PhaseSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    current_price = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    stand_count = serializers.IntegerField(read_only=True)
    price_steps = PriceStepSerializer(many=True, read_only=True)

    class Meta:
        model = Phase
        fields = '__all__'


class ConstructionMilestoneSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)

    class Meta:
        model = ConstructionMilestone
        fields = '__all__'


class BudgetLineSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    variance = serializers.DecimalField(max_digits=16, decimal_places=2, read_only=True)

    class Meta:
        model = BudgetLine
        fields = '__all__'


class ContractorSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    retention_held = serializers.DecimalField(max_digits=16, decimal_places=2, read_only=True)
    outstanding = serializers.DecimalField(max_digits=16, decimal_places=2, read_only=True)

    class Meta:
        model = Contractor
        fields = '__all__'


class SnagItemSerializer(serializers.ModelSerializer):
    stand_number = serializers.CharField(source='stand.stand_number', read_only=True)
    agreement_number = serializers.CharField(source='agreement.agreement_number', read_only=True)

    class Meta:
        model = SnagItem
        fields = '__all__'


class TitleTransferSerializer(serializers.ModelSerializer):
    agreement_number = serializers.CharField(source='agreement.agreement_number', read_only=True)
    buyer_name = serializers.CharField(source='agreement.buyer.full_name', read_only=True)
    project_name = serializers.CharField(source='agreement.project.name', read_only=True)
    stand_number = serializers.CharField(source='agreement.stand.stand_number', read_only=True)

    class Meta:
        model = TitleTransfer
        fields = '__all__'


class ReservationSerializer(serializers.ModelSerializer):
    stand_number = serializers.CharField(source='stand.stand_number', read_only=True)
    project_name = serializers.CharField(source='stand.project.name', read_only=True)
    seconds_remaining = serializers.IntegerField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = Reservation
        fields = '__all__'
        read_only_fields = ['reservation_number', 'reserved_at', 'expires_at', 'agreement']


class WaitlistEntrySerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)

    class Meta:
        model = WaitlistEntry
        fields = '__all__'
