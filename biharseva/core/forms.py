from django import forms
from .models import Report, Volunteer, DISTRICT_CHOICES

# -----------------------------

# Report Form

# -----------------------------

class ReportForm(forms.ModelForm):
    district = forms.ChoiceField(
        choices=DISTRICT_CHOICES,
        widget=forms.Select(attrs={'class': 'input-field'})
    )
    
    class Meta:
        model = Report
        fields = ['reporter_name', 'district', 'location', 'description', 'photo']
        
        widgets = {
            'reporter_name': forms.TextInput(attrs={
                'placeholder': 'Your full name',
                'class': 'input-field'
            }),
            'location': forms.TextInput(attrs={
                'placeholder': 'Exact location (landmark)',
                'class': 'input-field'
            }),
            'description': forms.Textarea(attrs={
                'placeholder': 'Describe the issue...',
                'rows': 4,
                'class': 'input-field'
            }),
        }

def clean_photo(self):
    photo = self.cleaned_data.get('photo')

    if photo:
        if photo.size > 5 * 1024 * 1024:
            raise forms.ValidationError("Image must be less than 5MB")

    return photo

# -----------------------------

# Volunteer Form

# -----------------------------

class VolunteerForm(forms.ModelForm):
    district = forms.ChoiceField(
        choices=DISTRICT_CHOICES,
        widget=forms.Select(attrs={'class': 'input-field'})
    )
    
    class Meta:
        model = Volunteer
        fields = ['name', 'college', 'email', 'phone', 'district']
    
        widgets = {
            'name': forms.TextInput(attrs={
                'placeholder': 'Full Name',
                'class': 'input-field'
            }),
            'college': forms.TextInput(attrs={
                'placeholder': 'College/University',
                'class': 'input-field'
            }),
            'email': forms.EmailInput(attrs={
                'placeholder': 'your@email.com',
                'class': 'input-field'
            }),
            'phone': forms.TextInput(attrs={
                'placeholder': '10 digit mobile',
                'class': 'input-field'
            }),
        }

# -----------------------------
# Phone Validation
# -----------------------------
def clean_phone(self):
    phone = self.cleaned_data.get('phone')

    if not phone.isdigit() or len(phone) != 10:
        raise forms.ValidationError("Enter a valid 10-digit mobile number")

    return phone

# -----------------------------
# Email Duplicate Handling
# -----------------------------
def clean_email(self):
    email = self.cleaned_data.get('email')

    if Volunteer.objects.filter(email=email).exists():
        raise forms.ValidationError("This email is already registered")

    return email

