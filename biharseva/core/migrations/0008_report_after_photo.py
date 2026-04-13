from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0007_volunteer_google_sub"),
    ]

    operations = [
        migrations.AddField(
            model_name="report",
            name="after_photo",
            field=models.ImageField(blank=True, null=True, upload_to="reports_images/"),
        ),
    ]
