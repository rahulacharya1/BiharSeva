from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0009_report_award_fields"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="report",
            name="is_awarded",
        ),
        migrations.RemoveField(
            model_name="report",
            name="award_title",
        ),
        migrations.RemoveField(
            model_name="report",
            name="award_points",
        ),
        migrations.RemoveField(
            model_name="report",
            name="awarded_at",
        ),
    ]
