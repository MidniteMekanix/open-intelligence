import os
import os.path
import time
from pathlib import Path

# Variables
path = os.getcwd() + '/images/'


# -----------------------------------------
# Camera image processing

# def get_camera_image_path():
#     return path


def get_camera_image_names(directory_path):
    files = []
    for file_name in os.listdir(directory_path):
        p = os.path.join(directory_path, file_name)
        if os.path.isdir(p):
            continue
        else:
            files.append(file_name)
    return files


def get_file_extension(root_path, directory_path, file_name):
    filename, file_extension = os.path.splitext(root_path + directory_path + file_name)
    return file_extension


def get_file_create_time(root_path, directory_path, file_name):
    return time.gmtime(os.path.getmtime(root_path + directory_path + file_name))


def get_file_create_year(gm_time):
    return time.strftime('%Y', gm_time)


def get_file_create_month(gm_time):
    return time.strftime('%m', gm_time)


def get_file_create_day(gm_time):
    return time.strftime('%d', gm_time)


def get_file_create_hour(gm_time, time_offset_hours=0):
    hours = int(time.strftime('%H', gm_time)) + time_offset_hours
    return str(hours)


def get_file_create_minute(gm_time):
    return time.strftime('%M', gm_time)


def get_file_create_second(gm_time):
    return time.strftime('%S', gm_time)


def get_file_mtime(root_path, directory_path, file_name):
    return os.path.getmtime(root_path + directory_path + file_name)


# -----------------------------------------
# Directory tools

def create_directory(directory_path):
    Path(directory_path).mkdir(parents=True, exist_ok=True)

# -----------------------------------------
