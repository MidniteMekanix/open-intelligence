import os
import sys
from module import process_utils, database, detection_utils
from objects import SrFile
from pathlib import Path
import psycopg2
import time

app_config = database.get_application_config()
use_gpu = database.find_config_value(app_config, 'use_gpu') == 'True'
if use_gpu is False:
    os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
    print('GPU Disabled at config')
from libraries.fast_srgan import infer_oi
from module import gpu_utils
from module.vehicle_color import vehicle_color_detect

# Check does system has GPU support
print('GPU support available: ' + str(gpu_utils.is_gpu_available()))

# Parse configs
process_sleep_seconds = database.find_config_value(app_config, 'process_sleep_seconds')
max_width = int(database.find_config_value(app_config, 'max_width'))
max_height = int(database.find_config_value(app_config, 'max_height'))

# Output path
output_root_folder_path = database.find_config_value(app_config, 'output_folder')


def is_null(input_variable):
    return input_variable is None or input_variable == '' or input_variable == ' '


def app():
    # Do work
    sr_work_records = database.get_super_resolution_images_to_compute()
    sr_image_objects = []
    for row in sr_work_records:
        # Get db row fields
        id = row[0]
        label = row[1]
        cropped_file_name = row[2]
        detection_result = row[3]

        # Construct paths
        input_image = output_root_folder_path + label + '/' + cropped_file_name
        output_image_path = output_root_folder_path + label + '/' + 'super_resolution/'
        output_image = output_image_path + cropped_file_name

        # Check path existence
        Path(output_image_path).mkdir(parents=True, exist_ok=True)

        # Make objects
        sr_image_object = SrFile.SrFile(id, label, cropped_file_name, input_image, output_image, detection_result, '')
        sr_image_objects.append(sr_image_object)

    # Super resolution image
    if len(sr_image_objects) > 0:
        # Process super resolution images
        sr_image_objects = infer_oi.process_super_resolution_images(
            sr_image_objects=sr_image_objects,
            max_width=max_width,
            max_height=max_height
        )

        # Process results
        for sr_image_object in sr_image_objects:
            # Label based detection if not detected earlier
            if is_null(sr_image_object.detection_result):
                sr_image_object.detection_result, sr_image_object.color = detection_utils.detect(
                    label=sr_image_object.label,
                    crop_image_file_path_name_extension=sr_image_object.output_image,
                    file_name=sr_image_object.image_name,
                    output_file_name=sr_image_object.label + '_' + sr_image_object.image_name,
                    use_rotation=True
                )

            # Try to detect color
            try:
                sr_image_object.color = vehicle_color_detect.detect_color(sr_image_object.output_image)
            except Exception as e:
                print(e)

            # Write database, row no longer processed later
            database.update_super_resolution_row_result(
                sr_image_object.detection_result,
                sr_image_object.color,
                sr_image_object.image_name,
                sr_image_object.id
            )
    else:
        print('No new sr image objects to process')


# ---------------------------------------------------------------------
# Keeps program running

def main_loop():
    while 1:
        try:
            process_utils.set_instance_status()
            app()
            print('... running')
        except psycopg2.OperationalError as e:
            print(e)
        time.sleep(int(process_sleep_seconds))


if __name__ == '__main__':
    try:
        main_loop()
    except KeyboardInterrupt:
        print >> sys.stderr, '\nExiting by user request.\n'
        sys.exit(0)

# ---------------------------------------------------------------------
