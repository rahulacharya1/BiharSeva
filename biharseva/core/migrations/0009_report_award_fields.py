from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0008_report_after_photo"),
    ]

    operations = [
        migrations.AddField(
            model_name="report",
            name="is_awarded",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="report",
            name="award_title",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="report",
            name="award_points",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="report",
            name="awarded_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
