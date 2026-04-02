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
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'placeholder': 'Create password',
            'class': 'input-field'
        })
    )
    password_confirm = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'placeholder': 'Confirm password',
            'class': 'input-field'
        })
    )
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

    def clean_phone(self):
        phone = self.cleaned_data.get('phone')

        if not phone.isdigit() or len(phone) != 10:
            raise forms.ValidationError("Enter a valid 10-digit mobile number")

        return phone

    def clean_email(self):
        email = self.cleaned_data.get('email')

        if Volunteer.objects.filter(email=email).exists():
            raise forms.ValidationError("This email is already registered")

        return email

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get('password')
        password_confirm = cleaned_data.get('password_confirm')

        if password and password_confirm and password != password_confirm:
            raise forms.ValidationError("Password and confirm password must match")

        return cleaned_data

    def save(self, commit=True):
        volunteer = super().save(commit=False)
        volunteer.set_password(self.cleaned_data['password'])

        if commit:
            volunteer.save()

        return volunteer

# -----------------------------
# Volunteer Login Form
# -----------------------------

class VolunteerLoginForm(forms.Form):
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={
            'placeholder': 'your@email.com',
            'class': 'input-field',
        })
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'placeholder': 'Password',
            'class': 'input-field',
        })
    )


class VolunteerPasswordResetForm(forms.Form):
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={
            'placeholder': 'your@email.com',
            'class': 'input-field',
        })
    )
    phone = forms.CharField(
        widget=forms.TextInput(attrs={
            'placeholder': '10 digit mobile',
            'class': 'input-field',
        })
    )
    new_password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'placeholder': 'New password',
            'class': 'input-field',
        })
    )
    confirm_password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'placeholder': 'Confirm new password',
            'class': 'input-field',
        })
    )

    def clean_phone(self):
        phone = self.cleaned_data.get('phone')

        if not phone.isdigit() or len(phone) != 10:
            raise forms.ValidationError('Enter a valid 10-digit mobile number')

        return phone

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get('new_password')
        confirm_password = cleaned_data.get('confirm_password')

        if password and confirm_password and password != confirm_password:
            raise forms.ValidationError('New password and confirm password must match')

        return cleaned_data


class VolunteerProfileForm(forms.ModelForm):
    new_password = forms.CharField(
        required=False,
        widget=forms.PasswordInput(attrs={
            'placeholder': 'New password (optional)',
            'class': 'input-field',
        })
    )
    confirm_password = forms.CharField(
        required=False,
        widget=forms.PasswordInput(attrs={
            'placeholder': 'Confirm new password',
            'class': 'input-field',
        })
    )

    class Meta:
        model = Volunteer
        fields = ['name', 'college', 'phone', 'district']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'input-field'}),
            'college': forms.TextInput(attrs={'class': 'input-field'}),
            'phone': forms.TextInput(attrs={'class': 'input-field'}),
            'district': forms.Select(attrs={'class': 'input-field'}),
        }

    def clean_phone(self):
        phone = self.cleaned_data.get('phone')

        if not phone.isdigit() or len(phone) != 10:
            raise forms.ValidationError("Enter a valid 10-digit mobile number")

        return phone

    def clean(self):
        cleaned_data = super().clean()
        new_password = cleaned_data.get('new_password')
        confirm_password = cleaned_data.get('confirm_password')

        if new_password or confirm_password:
            if new_password != confirm_password:
                raise forms.ValidationError("New password and confirm password must match")

        return cleaned_data


# -------------------------
# OTP-based Password Reset Forms
# -------------------------

class VolunteerOTPRequestForm(forms.Form):
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={
            'placeholder': 'your@email.com',
            'class': 'input-field',
        })
    )
    phone = forms.CharField(
        widget=forms.TextInput(attrs={
            'placeholder': '10 digit mobile',
            'class': 'input-field',
        })
    )

    def clean_phone(self):
        phone = self.cleaned_data.get('phone')
        if not phone.isdigit() or len(phone) != 10:
            raise forms.ValidationError('Enter a valid 10-digit mobile number')
        return phone


class VolunteerOTPVerifyForm(forms.Form):
    otp = forms.CharField(
        max_length=6,
        widget=forms.TextInput(attrs={
            'placeholder': '6-digit OTP',
            'class': 'input-field',
        })
    )
    new_password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'placeholder': 'New password',
            'class': 'input-field',
        })
    )
    confirm_password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'placeholder': 'Confirm new password',
            'class': 'input-field',
        })
    )

    def clean_otp(self):
        otp = self.cleaned_data.get('otp')
        if not otp.isdigit() or len(otp) != 6:
            raise forms.ValidationError('OTP must be a 6-digit number')
        return otp

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get('new_password')
        confirm_password = cleaned_data.get('confirm_password')

        if password and confirm_password and password != confirm_password:
            raise forms.ValidationError('New password and confirm password must match')

        return cleaned_data

