#!/usr/bin/env python3

import json
import requests


def nice(number: float):
    return round(number, 5)


if __name__ == '__main__':
    output = {}
    n1_sud_discount = 0.7
    m1_sud_discount = 0.7
    m2_sud_discount = 0.7
    m3_sud_discount = 1
    n2_sud_discount = 0.8
    n2d_sud_discount = 0.8
    c2_sud_discount = 0.8
    c2d_sud_discount = 0.8
    e2_sud_discount = 1
    a2_sud_discount = 1
    t2d_sud_discount = 1
    t2a_sud_discount = 0.7

    regions = ['us', 'us-central1', 'us-east1', 'us-east4', 'us-east5', 'us-west4', 'us-west1', 'us-west2',
               'us-west3', 'us-south1', 'europe', 'europe-central2', 'europe-west1', 'europe-west2',
               'europe-west3', 'europe-west4', 'europe-west6', 'europe-west8', 'europe-west9',
               'europe-west12', 'europe-north1', 'europe-southwest1', 'northamerica-northeast1',
               'northamerica-northeast2', 'asia', 'asia-east', 'asia-east1', 'asia-east2',
               'asia-northeast', 'me-west1', 'me-central1', 'asia-northeast1', 'asia-northeast2', 'asia-northeast3',
               'asia-southeast', 'asia-southeast1', 'australia-southeast1', 'australia-southeast2',
               'australia', 'southamerica-east1', 'asia-south1', 'asia-southeast2', 'asia-south2', 'southamerica-west1']

    specs_params = ['cores', 'memory', 'local_ssd', 'gpu', 'sole_tenant', 'nested_virtualization', 'cpu', 'benchmark']
    generations = ['f1', 'g1', 'n1', 'n2', 'n2d', 'e2', 'c2', 'c2d', 'm1', 'm2', 'm3', 'a2', 't2d', 't2a']
    # the following variables scraped from https://cloud.google.com/compute/docs/machine-types
    instance_types = ['e2-highcpu-32', 'e2-highcpu-16', 'e2-highcpu-2', 'e2-highcpu-4', 'e2-highcpu-8', 'e2-highmem-16',
                      'e2-highmem-2', 'e2-highmem-4', 'e2-highmem-8', 'e2-medium', 'e2-micro', 'e2-small',
                      'e2-standard-32',
                      'e2-standard-16', 'e2-standard-2', 'e2-standard-4', 'e2-standard-8', 'f1-micro', 'g1-small',
                      'n1-highcpu-16',
                      'n1-highcpu-2', 'n1-highcpu-32', 'n1-highcpu-4', 'n1-highcpu-64', 'n1-highcpu-8', 'n1-highcpu-96',
                      'n1-highmem-16', 'n1-highmem-2', 'n1-highmem-32', 'n1-highmem-4', 'n1-highmem-64', 'n1-highmem-8',
                      'n1-highmem-96', 'n1-standard-1', 'n1-standard-16', 'n1-standard-2',
                      'n1-standard-32', 'n1-standard-4', 'n1-standard-64', 'n1-standard-8', 'n1-standard-96',
                      'c2-standard-4', 'c2-standard-8', 'c2d-standard-2', 'c2d-standard-4', 'c2d-standard-8',
                      'c2d-standard-16', 'c2d-standard-32', 'c2d-standard-56', 'c2d-standard-112', 'c2d-highcpu-2',
                      'c2d-highcpu-4', 'c2d-highcpu-8', 'c2d-highcpu-16', 'c2d-highcpu-32', 'c2d-highcpu-56',
                      'c2d-highcpu-112', 'c2d-highmem-2', 'c2d-highmem-4', 'c2d-highmem-8',
                      'c2d-highmem-16', 'c2d-highmem-32', 'c2d-highmem-56', 'c2d-highmem-112',
                      'c2-standard-16', 'm1-ultramem-40', 'm1-ultramem-80', 'm1-ultramem-160',
                      'm1-megamem-96', 'c2-standard-30', 'c2-standard-60', 'm2-megamem-416', 'm2-ultramem-208',
                      'm2-ultramem-416',
                      'm3-ultramem-32', 'm3-ultramem-64', 'm3-ultramem-128', 'm3-megamem-64', 'm3-megamem-128',
                      'n2-standard-2', 'n2-standard-4', 'n2-standard-8', 'n2-standard-16', 'n2-standard-32',
                      'n2-standard-48', 'n2-standard-64', 'n2-standard-80', 'n2-standard-96', 'n2-standard-128',
                      'n2-highmem-2', 'n2-highmem-4', 'n2-highmem-8', 'n2-highmem-16', 'n2-highmem-32', 'n2-highmem-48',
                      'n2-highmem-64',
                      'n2-highmem-80', 'n2-highmem-96', 'n2-highmem-128', 'n2-highcpu-2', 'n2-highcpu-4',
                      'n2-highcpu-8', 'n2-highcpu-16', 'n2-highcpu-32',
                      'n2-highcpu-48', 'n2-highcpu-64', 'n2-highcpu-80', 'n2-highcpu-96', 'n2d-standard-2',
                      'n2d-standard-4', 'n2d-standard-8', 'n2d-standard-16', 'n2d-standard-32', 'n2d-standard-48',
                      'n2d-standard-64',
                      'n2d-standard-80', 'n2d-standard-96', 'n2d-standard-128', 'n2d-standard-224', 'n2d-highmem-2',
                      'n2d-highmem-4', 'n2d-highmem-8', 'n2d-highmem-16', 'n2d-highmem-32', 'n2d-highmem-48',
                      'n2d-highmem-64', 'n2d-highmem-80', 'n2d-highmem-96', 'n2d-highcpu-2', 'n2d-highcpu-4',
                      'n2d-highcpu-8', 'n2d-highcpu-16', 'n2d-highcpu-32', 'n2d-highcpu-48', 'n2d-highcpu-64',
                      'n2d-highcpu-80', 'n2d-highcpu-96', 'n2d-highcpu-128', 'n2d-highcpu-224', 'a2-highgpu-1g',
                      'a2-highgpu-2g', 'a2-highgpu-4g', 'a2-highgpu-8g', 'a2-megagpu-16g', 't2d-standard-1',
                      't2d-standard-2', 't2d-standard-4', 't2d-standard-8', 't2d-standard-16', 't2d-standard-32',
                      't2d-standard-48', 't2d-standard-60', 't2a-standard-1', 't2a-standard-2', 't2a-standard-4',
                      't2a-standard-8',
                      't2a-standard-16', 't2a-standard-32', 't2a-standard-48'
                      ]

    c2_instance_types = {
        "c2-standard-4": {"cpu": 4, "memory": 16, "local_ssd": 1, "network_egress": 10, "benchmark": 77310},
        "c2-standard-8": {"cpu": 8, "memory": 32, "local_ssd": 1, "network_egress": 16, "benchmark": 148689},
        "c2-standard-16": {"cpu": 16, "memory": 64, "local_ssd": 1, "network_egress": 32, "benchmark": 313768},
        "c2-standard-30": {"cpu": 30, "memory": 120, "local_ssd": 1, "network_egress": 32, "benchmark": 571147},
        "c2-standard-60": {"cpu": 60, "memory": 240, "local_ssd": 1, "network_egress": 32, "benchmark": 1142234}}

    c2d_instance_types = {
        "c2d-standard-2": {"cpu": 2, "memory": 8, "local_ssd": 1, "network_egress": 32, "benchmark": 41509},
        "c2d-standard-4": {"cpu": 4, "memory": 16, "local_ssd": 1, "network_egress": 32, "benchmark": 85847},
        "c2d-standard-8": {"cpu": 8, "memory": 32, "local_ssd": 1, "network_egress": 32, "benchmark": 156295},
        "c2d-standard-16": {"cpu": 16, "memory": 64, "local_ssd": 1, "network_egress": 32, "benchmark": 327768},
        "c2d-standard-32": {"cpu": 32, "memory": 128, "local_ssd": 1, "network_egress": 32, "benchmark": 655858},
        "c2d-standard-56": {"cpu": 56, "memory": 224, "local_ssd": 1, "network_egress": 32, "benchmark": 1147023},
        "c2d-standard-112": {"cpu": 112, "memory": 448, "local_ssd": 1, "network_egress": 32, "benchmark": 2378171},
        "c2d-highcpu-2": {"cpu": 2, "memory": 4, "local_ssd": 1, "network_egress": 32, "benchmark": 41513},
        "c2d-highcpu-4": {"cpu": 4, "memory": 8, "local_ssd": 1, "network_egress": 32, "benchmark": 85822},
        "c2d-highcpu-8": {"cpu": 8, "memory": 16, "local_ssd": 1, "network_egress": 32, "benchmark": 156259},
        "c2d-highcpu-16": {"cpu": 16, "memory": 32, "local_ssd": 1, "network_egress": 32, "benchmark": 328057},
        "c2d-highcpu-32": {"cpu": 32, "memory": 64, "local_ssd": 1, "network_egress": 32, "benchmark": 656020},
        "c2d-highcpu-56": {"cpu": 56, "memory": 112, "local_ssd": 1, "network_egress": 32, "benchmark": 1146929},
        "c2d-highcpu-112": {"cpu": 112, "memory": 224, "local_ssd": 1, "network_egress": 32, "benchmark": 2379950},
        "c2d-highmem-2": {"cpu": 2, "memory": 16, "local_ssd": 1, "network_egress": 32, "benchmark": 41429},
        "c2d-highmem-4": {"cpu": 4, "memory": 32, "local_ssd": 1, "network_egress": 32, "benchmark": 85938},
        "c2d-highmem-8": {"cpu": 8, "memory": 64, "local_ssd": 1, "network_egress": 32, "benchmark": 156488},
        "c2d-highmem-16": {"cpu": 16, "memory": 128, "local_ssd": 1, "network_egress": 32, "benchmark": 328023},
        "c2d-highmem-32": {"cpu": 32, "memory": 256, "local_ssd": 1, "network_egress": 32, "benchmark": 655657},
        "c2d-highmem-56": {"cpu": 56, "memory": 448, "local_ssd": 1, "network_egress": 32, "benchmark": 1146835},
        "c2d-highmem-112": {"cpu": 112, "memory": 896, "local_ssd": 1, "network_egress": 32, "benchmark": 2374591}}

    m1_instance_types = {
        "m1-ultramem-40": {"cpu": 40, "memory": 961, "local_ssd": 0, "network_egress": 32, "benchmark": 498947},
        "m1-ultramem-80": {"cpu": 80, "memory": 1922, "local_ssd": 0, "network_egress": 32, "benchmark": 994301},
        "m1-ultramem-160": {"cpu": 160, "memory": 3844, "local_ssd": 0, "network_egress": 32, "benchmark": 1967211},
        "m1-megamem-96": {"cpu": 96, "memory": 1433.6, "local_ssd": 1, "network_egress": 32, "benchmark": 1254891}}

    m2_instance_types = {
        "m2-ultramem-208": {"cpu": 208, "memory": 5888, "local_ssd": 0, "network_egress": 32, "benchmark": 3117739},
        "m2-ultramem-416": {"cpu": 416, "memory": 11776, "local_ssd": 0, "network_egress": 32, "benchmark": 5378985},
        "m2-megamem-416": {"cpu": 416, "memory": 5888, "local_ssd": 0, "network_egress": 32, "benchmark": 5365802}}

    m2_instance_types = {
        "m2-ultramem-208": {"cpu": 208, "memory": 5888, "local_ssd": 0, "network_egress": 32, "benchmark": 3117739},
        "m2-ultramem-416": {"cpu": 416, "memory": 11776, "local_ssd": 0, "network_egress": 32, "benchmark": 5378985},
        "m2-megamem-416": {"cpu": 416, "memory": 5888, "local_ssd": 0, "network_egress": 32, "benchmark": 5365802}}

    m3_instance_types = {
        "m3-ultramem-32": {"cpu": 32, "memory": 976, "local_ssd": 0, "network_egress": 32, "benchmark": 0},
        "m3-ultramem-64": {"cpu": 64, "memory": 1952, "local_ssd": 0, "network_egress": 32, "benchmark": 0},
        "m3-ultramem-128": {"cpu": 128, "memory": 3904, "local_ssd": 0, "network_egress": 32, "benchmark": 0},
        "m3-megamem-64": {"cpu": 64, "memory": 976, "local_ssd": 0, "network_egress": 32, "benchmark": 0},
        "m3-megamem-128": {"cpu": 128, "memory": 1952, "local_ssd": 0, "network_egress": 32, "benchmark": 0}}

    n2_instance_types = {
        "n2-standard-2": {"cpu": 2, "memory": 8, "local_ssd": 1, "network_egress": 10, "benchmark": 33676},
        "n2-standard-4": {"cpu": 4, "memory": 16, "local_ssd": 1, "network_egress": 10, "benchmark": 67643},
        "n2-standard-8": {"cpu": 8, "memory": 32, "local_ssd": 1, "network_egress": 16, "benchmark": 135272},
        "n2-standard-16": {"cpu": 16, "memory": 64, "local_ssd": 1, "network_egress": 32, "benchmark": 269760},
        "n2-standard-32": {"cpu": 32, "memory": 128, "local_ssd": 1, "network_egress": 32, "benchmark": 538050},
        "n2-standard-48": {"cpu": 48, "memory": 192, "local_ssd": 1, "network_egress": 32, "benchmark": 806235},
        "n2-standard-64": {"cpu": 64, "memory": 256, "local_ssd": 1, "network_egress": 32, "benchmark": 1069840},
        "n2-standard-80": {"cpu": 80, "memory": 320, "local_ssd": 1, "network_egress": 32, "benchmark": 1338406},
        "n2-standard-96": {"cpu": 96, "memory": 384, "local_ssd": 1, "network_egress": 32, "benchmark": 1590273},
        "n2-standard-128": {"cpu": 128, "memory": 512, "local_ssd": 1, "network_egress": 32, "benchmark": 2065382},
        "n2-highmem-2": {"cpu": 2, "memory": 16, "local_ssd": 1, "network_egress": 10, "benchmark": 33649},
        "n2-highmem-4": {"cpu": 4, "memory": 32, "local_ssd": 1, "network_egress": 10, "benchmark": 67702},
        "n2-highmem-8": {"cpu": 8, "memory": 64, "local_ssd": 1, "network_egress": 16, "benchmark": 135364},
        "n2-highmem-16": {"cpu": 16, "memory": 128, "local_ssd": 1, "network_egress": 32, "benchmark": 269842},
        "n2-highmem-32": {"cpu": 32, "memory": 256, "local_ssd": 1, "network_egress": 32, "benchmark": 538032},
        "n2-highmem-48": {"cpu": 48, "memory": 384, "local_ssd": 1, "network_egress": 32, "benchmark": 806506},
        "n2-highmem-64": {"cpu": 64, "memory": 512, "local_ssd": 1, "network_egress": 32, "benchmark": 1071112},
        "n2-highmem-80": {"cpu": 80, "memory": 640, "local_ssd": 1, "network_egress": 32, "benchmark": 1330008},
        "n2-highmem-96": {"cpu": 96, "memory": 768, "local_ssd": 1, "network_egress": 32, "benchmark": 1590062},
        "n2-highmem-128": {"cpu": 128, "memory": 864, "local_ssd": 1, "network_egress": 32, "benchmark": 2072337},
        "n2-highcpu-2": {"cpu": 2, "memory": 2, "local_ssd": 1, "network_egress": 10, "benchmark": 33719},
        "n2-highcpu-4": {"cpu": 4, "memory": 4, "local_ssd": 1, "network_egress": 10, "benchmark": 67817},
        "n2-highcpu-8": {"cpu": 8, "memory": 8, "local_ssd": 1, "network_egress": 16, "benchmark": 135527},
        "n2-highcpu-16": {"cpu": 16, "memory": 16, "local_ssd": 1, "network_egress": 32, "benchmark": 270110},
        "n2-highcpu-32": {"cpu": 32, "memory": 32, "local_ssd": 1, "network_egress": 32, "benchmark": 538530},
        "n2-highcpu-48": {"cpu": 48, "memory": 48, "local_ssd": 1, "network_egress": 32, "benchmark": 806668},
        "n2-highcpu-64": {"cpu": 64, "memory": 64, "local_ssd": 1, "network_egress": 32, "benchmark": 1070807},
        "n2-highcpu-80": {"cpu": 80, "memory": 80, "local_ssd": 1, "network_egress": 32, "benchmark": 1329120},
        "n2-highcpu-96": {"cpu": 96, "memory": 96, "local_ssd": 1, "network_egress": 32, "benchmark": 0}}

    e2_instance_types = {
        "e2-standard-2": {"cpu": 2, "memory": 8, "local_ssd": 0, "network_egress": 4, "benchmark": 26471},
        "e2-standard-4": {"cpu": 4, "memory": 16, "local_ssd": 0, "network_egress": 8, "benchmark": 54585},
        "e2-standard-8": {"cpu": 8, "memory": 32, "local_ssd": 0, "network_egress": 16, "benchmark": 104906},
        "e2-standard-16": {"cpu": 16, "memory": 64, "local_ssd": 0, "network_egress": 16, "benchmark": 220997},
        "e2-standard-32": {"cpu": 32, "memory": 128, "local_ssd": 0, "network_egress": 16, "benchmark": 439445},
        "e2-highmem-2": {"cpu": 2, "memory": 16, "local_ssd": 0, "network_egress": 4, "benchmark": 26470},
        "e2-highmem-4": {"cpu": 4, "memory": 32, "local_ssd": 0, "network_egress": 8, "benchmark": 54535},
        "e2-highmem-8": {"cpu": 8, "memory": 64, "local_ssd": 0, "network_egress": 16, "benchmark": 104887},
        "e2-highmem-16": {"cpu": 16, "memory": 128, "local_ssd": 0, "network_egress": 16, "benchmark": 221049},
        "e2-highcpu-2": {"cpu": 2, "memory": 2, "local_ssd": 0, "network_egress": 4, "benchmark": 26499},
        "e2-highcpu-4": {"cpu": 4, "memory": 4, "local_ssd": 0, "network_egress": 8, "benchmark": 54785},
        "e2-highcpu-8": {"cpu": 8, "memory": 8, "local_ssd": 0, "network_egress": 16, "benchmark": 104953},
        "e2-highcpu-16": {"cpu": 16, "memory": 16, "local_ssd": 0, "network_egress": 16, "benchmark": 220277},
        "e2-highcpu-32": {"cpu": 32, "memory": 32, "local_ssd": 0, "network_egress": 16, "benchmark": 438843}}

    n2d_instance_types = {
        "n2d-standard-2": {"cpu": 2, "memory": 8, "local_ssd": 1, "network_egress": 10, "benchmark": 38897},
        "n2d-standard-4": {"cpu": 4, "memory": 16, "local_ssd": 1, "network_egress": 10, "benchmark": 79682},
        "n2d-standard-8": {"cpu": 8, "memory": 32, "local_ssd": 1, "network_egress": 10, "benchmark": 145022},
        "n2d-standard-16": {"cpu": 16, "memory": 64, "local_ssd": 1, "network_egress": 32, "benchmark": 303974},
        "n2d-standard-32": {"cpu": 32, "memory": 128, "local_ssd": 1, "network_egress": 32, "benchmark": 611375},
        "n2d-standard-48": {"cpu": 48, "memory": 192, "local_ssd": 1, "network_egress": 32, "benchmark": 916485},
        "n2d-standard-64": {"cpu": 64, "memory": 256, "local_ssd": 1, "network_egress": 32, "benchmark": 1217192},
        "n2d-standard-80": {"cpu": 80, "memory": 320, "local_ssd": 1, "network_egress": 32, "benchmark": 1553066},
        "n2d-standard-96": {"cpu": 96, "memory": 384, "local_ssd": 1, "network_egress": 32, "benchmark": 1826345},
        "n2d-standard-128": {"cpu": 128, "memory": 512, "local_ssd": 1, "network_egress": 32, "benchmark": 2425400},
        "n2d-standard-224": {"cpu": 224, "memory": 896, "local_ssd": 1, "network_egress": 32, "benchmark": 3938461},
        "n2d-highmem-2": {"cpu": 2, "memory": 16, "local_ssd": 1, "network_egress": 10, "benchmark": 39065},
        "n2d-highmem-4": {"cpu": 4, "memory": 32, "local_ssd": 1, "network_egress": 10, "benchmark": 80661},
        "n2d-highmem-8": {"cpu": 8, "memory": 64, "local_ssd": 1, "network_egress": 10, "benchmark": 145124},
        "n2d-highmem-16": {"cpu": 16, "memory": 128, "local_ssd": 1, "network_egress": 32, "benchmark": 304101},
        "n2d-highmem-32": {"cpu": 32, "memory": 256, "local_ssd": 1, "network_egress": 32, "benchmark": 611819},
        "n2d-highmem-48": {"cpu": 48, "memory": 384, "local_ssd": 1, "network_egress": 32, "benchmark": 917010},
        "n2d-highmem-64": {"cpu": 64, "memory": 512, "local_ssd": 1, "network_egress": 32, "benchmark": 1220465},
        "n2d-highmem-80": {"cpu": 80, "memory": 640, "local_ssd": 1, "network_egress": 32, "benchmark": 1567766},
        "n2d-highmem-96": {"cpu": 96, "memory": 768, "local_ssd": 1, "network_egress": 32, "benchmark": 1868649},
        "n2d-highcpu-2": {"cpu": 2, "memory": 2, "local_ssd": 1, "network_egress": 10, "benchmark": 39106},
        "n2d-highcpu-4": {"cpu": 4, "memory": 4, "local_ssd": 1, "network_egress": 10, "benchmark": 79859},
        "n2d-highcpu-8": {"cpu": 8, "memory": 8, "local_ssd": 1, "network_egress": 10, "benchmark": 144995},
        "n2d-highcpu-16": {"cpu": 16, "memory": 16, "local_ssd": 1, "network_egress": 32, "benchmark": 304014},
        "n2d-highcpu-32": {"cpu": 32, "memory": 32, "local_ssd": 1, "network_egress": 32, "benchmark": 611726},
        "n2d-highcpu-48": {"cpu": 48, "memory": 48, "local_ssd": 1, "network_egress": 32, "benchmark": 916993},
        "n2d-highcpu-64": {"cpu": 64, "memory": 64, "local_ssd": 1, "network_egress": 32, "benchmark": 1218165},
        "n2d-highcpu-80": {"cpu": 80, "memory": 80, "local_ssd": 1, "network_egress": 32, "benchmark": 1562713},
        "n2d-highcpu-96": {"cpu": 96, "memory": 96, "local_ssd": 1, "network_egress": 32, "benchmark": 1870287},
        "n2d-highcpu-128": {"cpu": 128, "memory": 128, "local_ssd": 1, "network_egress": 32, "benchmark": 0},
        "n2d-highcpu-224": {"cpu": 224, "memory": 224, "local_ssd": 1, "network_egress": 32, "benchmark": 0}}

    n1_instance_types = {
        "n1-standard-1": {"cpu": 1, "memory": 3.75, "local_ssd": 1, "network_egress": 2, "benchmark": 20090},
        "n1-standard-2": {"cpu": 2, "memory": 7.5, "local_ssd": 1, "network_egress": 10, "benchmark": 26532},
        "n1-standard-4": {"cpu": 4, "memory": 15, "local_ssd": 1, "network_egress": 10, "benchmark": 54678},
        "n1-standard-8": {"cpu": 8, "memory": 30, "local_ssd": 1, "network_egress": 16, "benchmark": 105383},
        "n1-standard-16": {"cpu": 16, "memory": 60, "local_ssd": 1, "network_egress": 32, "benchmark": 221834},
        "n1-standard-32": {"cpu": 32, "memory": 120, "local_ssd": 1, "network_egress": 32, "benchmark": 440755},
        "n1-standard-64": {"cpu": 64, "memory": 240, "local_ssd": 1, "network_egress": 32, "benchmark": 883369},
        "n1-standard-96": {"cpu": 96, "memory": 360, "local_ssd": 1, "network_egress": 32, "benchmark": 1247197},
        "n1-highmem-2": {"cpu": 2, "memory": 13, "local_ssd": 1, "network_egress": 10, "benchmark": 26438},
        "n1-highmem-4": {"cpu": 4, "memory": 26, "local_ssd": 1, "network_egress": 10, "benchmark": 54337},
        "n1-highmem-8": {"cpu": 8, "memory": 52, "local_ssd": 1, "network_egress": 16, "benchmark": 104640},
        "n1-highmem-16": {"cpu": 16, "memory": 104, "local_ssd": 1, "network_egress": 32, "benchmark": 220547},
        "n1-highmem-32": {"cpu": 32, "memory": 208, "local_ssd": 1, "network_egress": 32, "benchmark": 439129},
        "n1-highmem-64": {"cpu": 64, "memory": 416, "local_ssd": 1, "network_egress": 32, "benchmark": 879708},
        "n1-highmem-96": {"cpu": 96, "memory": 624, "local_ssd": 1, "network_egress": 32, "benchmark": 1248277},
        "n1-highcpu-2": {"cpu": 2, "memory": 1.8, "local_ssd": 1, "network_egress": 10, "benchmark": 26517},
        "n1-highcpu-4": {"cpu": 4, "memory": 3.6, "local_ssd": 1, "network_egress": 10, "benchmark": 54676},
        "n1-highcpu-8": {"cpu": 8, "memory": 7.2, "local_ssd": 1, "network_egress": 16, "benchmark": 105053},
        "n1-highcpu-16": {"cpu": 16, "memory": 14.4, "local_ssd": 1, "network_egress": 32, "benchmark": 221443},
        "n1-highcpu-32": {"cpu": 32, "memory": 28.8, "local_ssd": 1, "network_egress": 32, "benchmark": 438006},
        "n1-highcpu-64": {"cpu": 64, "memory": 57.6, "local_ssd": 1, "network_egress": 32, "benchmark": 874912},
        "n1-highcpu-96": {"cpu": 96, "memory": 86.4, "local_ssd": 1, "network_egress": 32, "benchmark": 1245251}}

    a2_instance_types = {
        "a2-highgpu-1g": {"cpu": 12, "memory": 85, "local_ssd": 1, "network_egress": 24, "benchmark": 0},
        "a2-highgpu-2g": {"cpu": 24, "memory": 170, "local_ssd": 1, "network_egress": 32, "benchmark": 0},
        "a2-highgpu-4g": {"cpu": 48, "memory": 340, "local_ssd": 1, "network_egress": 50, "benchmark": 0},
        "a2-highgpu-8g": {"cpu": 96, "memory": 680, "local_ssd": 1, "network_egress": 100, "benchmark": 0},
        "a2-megagpu-16g": {"cpu": 96, "memory": 1360, "local_ssd": 1, "network_egress": 100, "benchmark": 0}}

    t2d_instance_types = {
        "t2d-standard-1": {"cpu": 1, "memory": 4, "local_ssd": 0, "network_egress": 10, "benchmark": 28961},
        "t2d-standard-2": {"cpu": 2, "memory": 8, "local_ssd": 0, "network_egress": 10, "benchmark": 58601},
        "t2d-standard-4": {"cpu": 4, "memory": 16, "local_ssd": 0, "network_egress": 10, "benchmark": 118761},
        "t2d-standard-8": {"cpu": 8, "memory": 32, "local_ssd": 0, "network_egress": 16, "benchmark": 229103},
        "t2d-standard-16": {"cpu": 16, "memory": 64, "local_ssd": 0, "network_egress": 32, "benchmark": 451682},
        "t2d-standard-32": {"cpu": 32, "memory": 128, "local_ssd": 0, "network_egress": 32, "benchmark": 886865},
        "t2d-standard-48": {"cpu": 48, "memory": 192, "local_ssd": 0, "network_egress": 32, "benchmark": 1305259},
        "t2d-standard-60": {"cpu": 60, "memory": 240, "local_ssd": 0, "network_egress": 32, "benchmark": 1588850}}

    t2a_instance_types = {
        "t2a-standard-1": {"cpu": 1, "memory": 4, "local_ssd": 0, "network_egress": 10, "benchmark": 23261},
        "t2a-standard-2": {"cpu": 2, "memory": 8, "local_ssd": 0, "network_egress": 10, "benchmark": 46385},
        "t2a-standard-4": {"cpu": 4, "memory": 16, "local_ssd": 0, "network_egress": 10, "benchmark": 92973},
        "t2a-standard-8": {"cpu": 8, "memory": 32, "local_ssd": 0, "network_egress": 16, "benchmark": 185998},
        "t2a-standard-16": {"cpu": 16, "memory": 64, "local_ssd": 0, "network_egress": 32, "benchmark": 371142},
        "t2a-standard-32": {"cpu": 32, "memory": 128, "local_ssd": 0, "network_egress": 32, "benchmark": 736262},
        "t2a-standard-48": {"cpu": 48, "memory": 192, "local_ssd": 0, "network_egress": 32, "benchmark": 1102993}}

    for gen in generations:
        output[gen] = {}
        for instance_t in instance_types:
            instance_t_generation = instance_t.split('-')[0]
            if instance_t_generation == gen:
                output[gen][instance_t] = {'regions': {}, 'specs': {}}
                for region in regions:
                    output[gen][instance_t]['regions'][region] = {}
                for spec in specs_params:
                    output[gen][instance_t]['specs'][spec] = {}

    # OS License
    output['license'] = {}

    # Download GCP Calculator pricing, and reformat it to GCPinstances.info strcture
    data_json = requests.get('https://cloudpricingcalculator.appspot.com/static/data/pricelist.json').json()
    data = data_json['gcp_price_list']
    for k, v in data.items():
        if k == 'CP-COMPUTEENGINE-OS':
            for kk, vv in v.items():
                output['license'][kk] = vv
        if k == 'CP-COMPUTEENGINE-VMIMAGE-F1-MICRO':
            for kk, vv in v.items():
                if kk in regions:
                    output['f1']['f1-micro']['regions'][kk] = {'ondemand': vv}
                if kk in specs_params:
                    # CPU type pulled from /proc/cpuinfo
                    output['f1']['f1-micro']['specs'].update(
                        {kk: vv, 'cpu': ['Intel Xeon @ 2.30GHz'], 'gpu': 0, 'local_ssd': 0, 'nested_virtualization': 0,
                         'sole_tenant': 0, 'benchmark': 4111})
        if k == 'CP-COMPUTEENGINE-VMIMAGE-G1-SMALL':
            for kk, vv in v.items():
                if kk in regions:
                    output['g1']['g1-small']['regions'][kk] = {'ondemand': vv}
                if kk in specs_params:
                    # CPU type pulled from /proc/cpuinfo
                    output['g1']['g1-small']['specs'].update(
                        {kk: vv, 'cpu': ['Intel Xeon @ 2.30GHz'], 'gpu': 0, 'local_ssd': 0, 'nested_virtualization': 0,
                         'sole_tenant': 0, 'benchmark': 10657})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-1':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-standard-1']['regions'][kk] = {'ondemand': vv}
                    output['n1']['n1-standard-1']['regions'][kk].update({'sud': nice(vv * n1_sud_discount)})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-2':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-standard-2']['regions'][kk] = {'ondemand': vv}
                    output['n1']['n1-standard-2']['regions'][kk].update({'sud': nice(vv * n1_sud_discount)})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-4':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-standard-4']['regions'][kk] = {'ondemand': vv}
                    output['n1']['n1-standard-4']['regions'][kk].update({'sud': nice(vv * n1_sud_discount)})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-8':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-standard-8']['regions'][kk] = {'ondemand': vv}
                    output['n1']['n1-standard-8']['regions'][kk].update({'sud': nice(vv * n1_sud_discount)})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-16':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-standard-16']['regions'][kk] = {'ondemand': vv}
                    output['n1']['n1-standard-16']['regions'][kk].update({'sud': nice(vv * n1_sud_discount)})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-32':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-standard-32']['regions'][kk] = {'ondemand': vv}
                    output['n1']['n1-standard-32']['regions'][kk].update({'sud': nice(vv * n1_sud_discount)})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-64':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-standard-64']['regions'][kk] = {'ondemand': vv}
                    output['n1']['n1-standard-64']['regions'][kk].update({'sud': nice(vv * n1_sud_discount)})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-96':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-standard-96']['regions'][kk] = {'ondemand': vv}
                    output['n1']['n1-standard-96']['regions'][kk].update({'sud': nice(vv * n1_sud_discount)})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHMEM-2':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highmem-2']['regions'][kk] = {'ondemand': vv}
                    output['n1']['n1-highmem-2']['regions'][kk].update({'sud': nice(vv * n1_sud_discount)})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHMEM-4':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highmem-4']['regions'][kk] = {'ondemand': vv}
                    output['n1']['n1-highmem-4']['regions'][kk].update({'sud': nice(vv * n1_sud_discount)})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHMEM-8':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highmem-8']['regions'][kk] = {'ondemand': vv}
                    output['n1']['n1-highmem-8']['regions'][kk].update({'sud': nice(vv * n1_sud_discount)})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHMEM-16':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highmem-16']['regions'][kk] = {'ondemand': vv}
                    output['n1']['n1-highmem-16']['regions'][kk].update({'sud': nice(vv * n1_sud_discount)})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHMEM-32':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highmem-32']['regions'][kk] = {'ondemand': vv}
                    output['n1']['n1-highmem-32']['regions'][kk].update({'sud': nice(vv * n1_sud_discount)})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHMEM-64':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highmem-64']['regions'][kk] = {'ondemand': vv}
                    output['n1']['n1-highmem-64']['regions'][kk].update({'sud': nice(vv * n1_sud_discount)})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHMEM-96':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highmem-96']['regions'][kk] = {'ondemand': vv}
                    output['n1']['n1-highmem-96']['regions'][kk].update({'sud': nice(vv * n1_sud_discount)})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHCPU-2':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highcpu-2']['regions'][kk] = {'ondemand': vv}
                    output['n1']['n1-highcpu-2']['regions'][kk].update({'sud': nice(vv * n1_sud_discount)})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHCPU-4':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highcpu-4']['regions'][kk] = {'ondemand': vv}
                    output['n1']['n1-highcpu-4']['regions'][kk].update({'sud': nice(vv * n1_sud_discount)})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHCPU-8':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highcpu-8']['regions'][kk] = {'ondemand': vv}
                    output['n1']['n1-highcpu-8']['regions'][kk].update({'sud': nice(vv * n1_sud_discount)})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHCPU-16':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highcpu-16']['regions'][kk] = {'ondemand': vv}
                    output['n1']['n1-highcpu-16']['regions'][kk].update({'sud': nice(vv * n1_sud_discount)})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHCPU-32':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highcpu-32']['regions'][kk] = {'ondemand': vv}
                    output['n1']['n1-highcpu-32']['regions'][kk].update({'sud': nice(vv * n1_sud_discount)})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHCPU-64':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highcpu-64']['regions'][kk] = {'ondemand': vv}
                    output['n1']['n1-highcpu-64']['regions'][kk].update({'sud': nice(vv * n1_sud_discount)})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHCPU-96':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highcpu-96']['regions'][kk] = {'ondemand': vv}
                    output['n1']['n1-highcpu-96']['regions'][kk].update({'sud': nice(vv * n1_sud_discount)})

        #### PREEMPTIBLE INSTANCES

        if k == 'CP-COMPUTEENGINE-VMIMAGE-F1-MICRO-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['f1']['f1-micro']['regions'][kk].update({'preemptible': vv})
        if k == 'CP-COMPUTEENGINE-VMIMAGE-G1-SMALL-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['g1']['g1-small']['regions'][kk].update({'preemptible': vv})
        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-1-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-standard-1']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-2-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-standard-2']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-4-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-standard-4']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-8-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-standard-8']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-16-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-standard-16']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-32-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-standard-32']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-64-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-standard-64']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-96-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-standard-96']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHMEM-2-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highmem-2']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHMEM-4-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highmem-4']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHMEM-8-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highmem-8']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHMEM-16-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highmem-16']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHMEM-32-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highmem-32']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHMEM-64-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highmem-64']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHMEM-96-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highmem-96']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHCPU-2-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highcpu-2']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHCPU-4-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highcpu-4']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHCPU-8-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highcpu-8']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHCPU-16-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highcpu-16']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHCPU-32-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highcpu-32']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHCPU-64-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highcpu-64']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHCPU-96-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highcpu-96']['regions'][kk].update({'preemptible': vv})
        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-1-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-standard-1']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-2-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-standard-2']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-4-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-standard-4']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-8-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-standard-8']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-16-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-standard-16']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-32-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-standard-32']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-64-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-standard-64']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-96-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-standard-96']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHMEM-2-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highmem-2']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHMEM-4-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highmem-4']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHMEM-8-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highmem-8']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHMEM-16-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highmem-16']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHMEM-32-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highmem-32']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHMEM-64-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highmem-64']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHMEM-96-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highmem-96']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHCPU-2-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highcpu-2']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHCPU-4-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highcpu-4']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHCPU-8-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highcpu-8']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHCPU-16-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highcpu-16']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHCPU-32-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highcpu-32']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHCPU-64-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highcpu-64']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHCPU-96-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['n1']['n1-highcpu-96']['regions'][kk].update({'preemptible': vv})
        ### E2
        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-HIGHCPU-2':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-highcpu-2']['regions'][kk] = {'ondemand': vv}
                if kk in specs_params:
                    output['e2']['e2-highcpu-2']['specs'].update({kk: vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-STANDARD-2':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-standard-2']['regions'][kk] = {'ondemand': vv}
                if kk in specs_params:
                    output['e2']['e2-standard-2']['specs'].update({kk: vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-STANDARD-16':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-standard-16']['regions'][kk] = {'ondemand': vv}
                if kk in specs_params:
                    output['e2']['e2-standard-16']['specs'].update({kk: vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-STANDARD-32':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-standard-32']['regions'][kk] = {'ondemand': vv}
                if kk in specs_params:
                    output['e2']['e2-standard-32']['specs'].update({kk: vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-HIGHMEM-16':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-highmem-16']['regions'][kk] = {'ondemand': vv}
                if kk in specs_params:
                    output['e2']['e2-highmem-16']['specs'].update({kk: vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-STANDARD-2':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-standard-2']['regions'][kk] = {'ondemand': vv}
                if kk in specs_params:
                    output['e2']['e2-standard-2']['specs'].update({kk: vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-STANDARD-4':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-standard-4']['regions'][kk] = {'ondemand': vv}
                if kk in specs_params:
                    output['e2']['e2-standard-4']['specs'].update({kk: vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-STANDARD-8':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-standard-8']['regions'][kk] = {'ondemand': vv}
                if kk in specs_params:
                    output['e2']['e2-standard-8']['specs'].update({kk: vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-SMALL':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-small']['regions'][kk] = {'ondemand': vv}
                if kk in specs_params:
                    output['e2']['e2-small']['specs'].update(
                        {'cores': 2, 'memory': 2, 'cpu': ['N/A'], 'gpu': 0, 'local_ssd': 0, 'nested_virtualization': 0,
                         'sole_tenant': 0, 'benchmark': 6745, 'network_egress': 1})
        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-STANDARD-8':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-standard-8']['regions'][kk] = {'ondemand': vv}
                if kk in specs_params:
                    output['e2']['e2-standard-8']['specs'].update({kk: vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-STANDARD-16':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-standard-16']['regions'][kk] = {'ondemand': vv}
                if kk in specs_params:
                    output['e2']['e2-standard-16']['specs'].update({kk: vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-STANDARD-32':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-standard-32']['regions'][kk] = {'ondemand': vv}
                if kk in specs_params:
                    output['e2']['e2-standard-32']['specs'].update({kk: vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-HIGHMEM-16':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-highmem-16']['regions'][kk] = {'ondemand': vv}
                if kk in specs_params:
                    output['e2']['e2-highmem-16']['specs'].update({kk: vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-STANDARD-4':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-standard-4']['regions'][kk] = {'ondemand': vv}
                if kk in specs_params:
                    output['e2']['e2-standard-4']['specs'].update({kk: vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-HIGHMEM-8':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-highmem-8']['regions'][kk] = {'ondemand': vv}
                if kk in specs_params:
                    output['e2']['e2-highmem-8']['specs'].update({kk: vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-HIGHCPU-16':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-highcpu-16']['regions'][kk] = {'ondemand': vv}
                if kk in specs_params:
                    output['e2']['e2-highcpu-16']['specs'].update({kk: vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-HIGHCPU-32':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-highcpu-32']['regions'][kk] = {'ondemand': vv}
                if kk in specs_params:
                    output['e2']['e2-highcpu-32']['specs'].update({kk: vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-HIGHMEM-4':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-highmem-4']['regions'][kk] = {'ondemand': vv}
                if kk in specs_params:
                    output['e2']['e2-highmem-4']['specs'].update({kk: vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-HIGHCPU-16':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-highcpu-16']['regions'][kk] = {'ondemand': vv}
                if kk in specs_params:
                    output['e2']['e2-highcpu-16']['specs'].update({kk: vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-HIGHCPU-32':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-highcpu-32']['regions'][kk] = {'ondemand': vv}
                if kk in specs_params:
                    output['e2']['e2-highcpu-32']['specs'].update({kk: vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-HIGHMEM-8':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-highmem-8']['regions'][kk] = {'ondemand': vv}
                if kk in specs_params:
                    output['e2']['e2-highmem-8']['specs'].update({kk: vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-HIGHMEM-2':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-highmem-2']['regions'][kk] = {'ondemand': vv}
                if kk in specs_params:
                    output['e2']['e2-highmem-2']['specs'].update({kk: vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-MICRO':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-micro']['regions'][kk] = {'ondemand': vv}
                if kk in specs_params:
                    output['e2']['e2-micro']['specs'].update(
                        {'cores': 2, 'memory': 1, 'cpu': ['Skylake', 'Broadwell', 'Haswell', 'AMD EPYC Rome'], 'gpu': 0,
                         'local_ssd': 0, 'nested_virtualization': 0,
                         'sole_tenant': 0, 'benchmark': 3238, 'network_egress': 1})
        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-HIGHCPU-4':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-highcpu-4']['regions'][kk] = {'ondemand': vv}
                if kk in specs_params:
                    output['e2']['e2-highcpu-4']['specs'].update({kk: vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-HIGHMEM-2':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-highmem-2']['regions'][kk] = {'ondemand': vv}
                if kk in specs_params:
                    output['e2']['e2-highmem-2']['specs'].update({kk: vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-HIGHCPU-8':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-highcpu-8']['regions'][kk] = {'ondemand': vv}
                if kk in specs_params:
                    output['e2']['e2-highcpu-8']['specs'].update({kk: vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-HIGHCPU-8':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-highcpu-8']['regions'][kk] = {'ondemand': vv}
                if kk in specs_params:
                    output['e2']['e2-highcpu-8']['specs'].update({kk: vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-MEDIUM':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-medium']['regions'][kk] = {'ondemand': vv}
                if kk in specs_params:
                    output['e2']['e2-medium']['specs'].update(
                        {'cores': 2, 'memory': 4, 'cpu': ['Skylake', 'Broadwell', 'Haswell', 'AMD EPYC Rome'], 'gpu': 0,
                         'local_ssd': 0, 'nested_virtualization': 0,
                         'sole_tenant': 0, 'benchmark': 14529, 'network_egress': 2})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-HIGHCPU-2':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-highcpu-2']['regions'][kk] = {'ondemand': vv}
                if kk in specs_params:
                    output['e2']['e2-highcpu-2']['specs'].update({kk: vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-HIGHCPU-4':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-highcpu-4']['regions'][kk] = {'ondemand': vv}
                if kk in specs_params:
                    output['e2']['e2-highcpu-4']['specs'].update({kk: vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-HIGHMEM-4':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-highmem-4']['regions'][kk] = {'ondemand': vv}
                if kk in specs_params:
                    output['e2']['e2-highmem-4']['specs'].update({kk: vv})

        ### PREEMPTIBLE E2
        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-HIGHCPU-2-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-highcpu-2']['regions'][kk].update({'preemptible': vv})
        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-STANDARD-2-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-standard-2']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-HIGHMEM-16-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-highmem-16']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-STANDARD-8-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-standard-8']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-STANDARD-16-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-standard-16']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-STANDARD-32-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-standard-32']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-MICRO-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-micro']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-MEDIUM-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-medium']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-SMALL-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-small']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-STANDARD-4-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-standard-4']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-HIGHCPU-16-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-highcpu-16']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-HIGHCPU-32-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-highcpu-32']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-HIGHMEM-8-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-highmem-8']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-HIGHCPU-4-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-highcpu-4']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-HIGHMEM-2-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-highmem-2']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-HIGHCPU-8-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-highcpu-8']['regions'][kk].update({'preemptible': vv})

        if k == 'CP-COMPUTEENGINE-VMIMAGE-E2-HIGHMEM-4-PREEMPTIBLE':
            for kk, vv in v.items():
                if kk in regions:
                    output['e2']['e2-highmem-4']['regions'][kk].update({'preemptible': vv})

    # N1
    # Update specs
    for k, v in n1_instance_types.items():
        output['n1'][k]['specs'].update({'cores': v['cpu'], 'memory': v['memory'], 'local_ssd': v['local_ssd'],
                                         'network_egress': v['network_egress'], 'benchmark': v['benchmark'],
                                         'cpu': ['Skylake', 'Broadwell', 'Haswell', 'Sandy Bridge', 'Ivy Bridge'],
                                         'gpu': 1, 'nested_virtualization': 1, 'sole_tenant': 1, 'regional_disk': 1})
    # C2D
    # On Demand, SUD and specs
    c2d_ram = data['CP-COMPUTEENGINE-C2D-PREDEFINED-VM-RAM']
    c2d_cpu = data['CP-COMPUTEENGINE-C2D-PREDEFINED-VM-CORE']
    for k, v in c2d_instance_types.items():
        output['c2d'][k]['specs'].update({'cores': v['cpu'], 'memory': v['memory'], 'local_ssd': v['local_ssd'],
                                          'network_egress': v['network_egress'], 'benchmark': v['benchmark'],
                                          'cpu': ['AMD EPYC Milan 3rd Generation'],
                                          'regional_disk': 0, 'gpu': 0, 'sole_tenant': -1,
                                          'nested_virtualization': -1})
        for reg, c2d_cpu_region_cost in c2d_cpu.items():
            for reg2, c2d_ram_region_cost in c2d_ram.items():
                if reg == reg2:
                    output['c2d'][k]['regions'][reg]['ondemand'] = nice(v['cpu'] * c2d_cpu_region_cost + v[
                        'memory'] * c2d_ram_region_cost)
                    output['c2d'][k]['regions'][reg]['sud'] = nice(
                        c2d_sud_discount * (v['cpu'] * c2d_cpu_region_cost + v[
                            'memory'] * c2d_ram_region_cost))
    # Preemptible
    c2d_ram = data['CP-COMPUTEENGINE-C2D-PREDEFINED-VM-RAM-PREEMPTIBLE']
    c2d_cpu = data['CP-COMPUTEENGINE-C2D-PREDEFINED-VM-CORE-PREEMPTIBLE']
    for k, v in c2d_instance_types.items():
        for reg, c2d_cpu_region_cost in c2d_cpu.items():
            for reg2, c2d_ram_region_cost in c2d_ram.items():
                if reg == reg2:
                    output['c2d'][k]['regions'][reg]['preemptible'] = nice(v['cpu'] * c2d_cpu_region_cost + v[
                        'memory'] * c2d_ram_region_cost)
    # CUD - 1 year
    c2d_ram = data['CP-COMPUTEENGINE-C2D-CUD-1-YEAR-RAM']
    c2d_cpu = data['CP-COMPUTEENGINE-C2D-CUD-1-YEAR-CPU']
    for k, v in c2d_instance_types.items():
        for reg, c2d_cpu_region_cost in c2d_cpu.items():
            for reg2, c2d_ram_region_cost in c2d_ram.items():
                if reg == reg2:
                    output['c2d'][k]['regions'][reg]['cud-1y'] = nice(v['cpu'] * c2d_cpu_region_cost + v[
                        'memory'] * c2d_ram_region_cost)
    # CUD - 3 year
    c2d_ram = data['CP-COMPUTEENGINE-C2D-CUD-3-YEAR-RAM']
    c2d_cpu = data['CP-COMPUTEENGINE-C2D-CUD-3-YEAR-CPU']
    for k, v in c2d_instance_types.items():
        for reg, c2d_cpu_region_cost in c2d_cpu.items():
            for reg2, c2d_ram_region_cost in c2d_ram.items():
                if reg == reg2:
                    output['c2d'][k]['regions'][reg]['cud-3y'] = nice(v['cpu'] * c2d_cpu_region_cost + v[
                        'memory'] * c2d_ram_region_cost)

    # C2
    # On Demand, SUD and specs
    c2_ram = data['CP-COMPUTEENGINE-C2-PREDEFINED-VM-RAM']
    c2_cpu = data['CP-COMPUTEENGINE-C2-PREDEFINED-VM-CORE']
    for k, v in c2_instance_types.items():
        output['c2'][k]['specs'].update({'cores': v['cpu'], 'memory': v['memory'], 'local_ssd': v['local_ssd'],
                                         'network_egress': v['network_egress'], 'benchmark': v['benchmark'],
                                         'cpu': ['Cascade Lake'],
                                         'regional_disk': 0, 'gpu': 0, 'sole_tenant': -1,
                                         'nested_virtualization': -1})
        for reg, c2_cpu_region_cost in c2_cpu.items():
            for reg2, c2_ram_region_cost in c2_ram.items():
                if reg == reg2:
                    output['c2'][k]['regions'][reg]['ondemand'] = nice(v['cpu'] * c2_cpu_region_cost + v[
                        'memory'] * c2_ram_region_cost)
                    output['c2'][k]['regions'][reg]['sud'] = nice(
                        c2_sud_discount * (v['cpu'] * c2_cpu_region_cost + v[
                            'memory'] * c2_ram_region_cost))
    # Preemptible
    c2_ram = data['CP-COMPUTEENGINE-C2-PREDEFINED-VM-RAM-PREEMPTIBLE']
    c2_cpu = data['CP-COMPUTEENGINE-C2-PREDEFINED-VM-CORE-PREEMPTIBLE']
    for k, v in c2_instance_types.items():
        for reg, c2_cpu_region_cost in c2_cpu.items():
            for reg2, c2_ram_region_cost in c2_ram.items():
                if reg == reg2:
                    output['c2'][k]['regions'][reg]['preemptible'] = nice(v['cpu'] * c2_cpu_region_cost + v[
                        'memory'] * c2_ram_region_cost)
    # CUD - 1 year
    c2_ram = data['CP-COMPUTEENGINE-C2-CUD-1-YEAR-RAM']
    c2_cpu = data['CP-COMPUTEENGINE-C2-CUD-1-YEAR-CPU']
    for k, v in c2_instance_types.items():
        for reg, c2_cpu_region_cost in c2_cpu.items():
            for reg2, c2_ram_region_cost in c2_ram.items():
                if reg == reg2:
                    output['c2'][k]['regions'][reg]['cud-1y'] = nice(v['cpu'] * c2_cpu_region_cost + v[
                        'memory'] * c2_ram_region_cost)
    # CUD - 3 year
    c2_ram = data['CP-COMPUTEENGINE-C2-CUD-3-YEAR-RAM']
    c2_cpu = data['CP-COMPUTEENGINE-C2-CUD-3-YEAR-CPU']
    for k, v in c2_instance_types.items():
        for reg, c2_cpu_region_cost in c2_cpu.items():
            for reg2, c2_ram_region_cost in c2_ram.items():
                if reg == reg2:
                    output['c2'][k]['regions'][reg]['cud-3y'] = nice(v['cpu'] * c2_cpu_region_cost + v[
                        'memory'] * c2_ram_region_cost)

    # A2
    # On Demand, SUD and specs
    a2_ram = data['CP-COMPUTEENGINE-A2-PREDEFINED-VM-RAM']
    a2_cpu = data['CP-COMPUTEENGINE-A2-PREDEFINED-VM-CORE']
    for k, v in a2_instance_types.items():
        output['a2'][k]['specs'].update({'cores': v['cpu'], 'memory': v['memory'], 'local_ssd': v['local_ssd'],
                                         'network_egress': v['network_egress'], 'benchmark': v['benchmark'],
                                         'cpu': ['Cascade Lake'],
                                         'regional_disk': 1, 'gpu': 1, 'sole_tenant': -1,
                                         'nested_virtualization': -1})
        for reg, a2_cpu_region_cost in a2_cpu.items():
            for reg2, a2_ram_region_cost in a2_ram.items():
                if reg == reg2:
                    output['a2'][k]['regions'][reg]['ondemand'] = nice(v['cpu'] * a2_cpu_region_cost + v[
                        'memory'] * a2_ram_region_cost)
                    output['a2'][k]['regions'][reg]['sud'] = nice(
                        a2_sud_discount * (v['cpu'] * a2_cpu_region_cost + v[
                            'memory'] * a2_ram_region_cost))
    # Preemptible
    a2_ram = data['CP-COMPUTEENGINE-A2-PREDEFINED-VM-RAM-PREEMPTIBLE']
    a2_cpu = data['CP-COMPUTEENGINE-A2-PREDEFINED-VM-CORE-PREEMPTIBLE']
    for k, v in a2_instance_types.items():
        for reg, a2_cpu_region_cost in a2_cpu.items():
            for reg2, a2_ram_region_cost in a2_ram.items():
                if reg == reg2:
                    output['a2'][k]['regions'][reg]['preemptible'] = nice(v['cpu'] * a2_cpu_region_cost + v[
                        'memory'] * a2_ram_region_cost)
    # CUD - 1 year
    a2_ram = data['CP-COMPUTEENGINE-A2-CUD-1-YEAR-RAM']
    a2_cpu = data['CP-COMPUTEENGINE-A2-CUD-1-YEAR-CPU']
    for k, v in a2_instance_types.items():
        for reg, a2_cpu_region_cost in a2_cpu.items():
            for reg2, a2_ram_region_cost in a2_ram.items():
                if reg == reg2:
                    output['a2'][k]['regions'][reg]['cud-1y'] = nice(v['cpu'] * a2_cpu_region_cost + v[
                        'memory'] * a2_ram_region_cost)
    # CUD - 3 year
    a2_ram = data['CP-COMPUTEENGINE-A2-CUD-3-YEAR-RAM']
    a2_cpu = data['CP-COMPUTEENGINE-A2-CUD-3-YEAR-CPU']
    for k, v in a2_instance_types.items():
        for reg, a2_cpu_region_cost in a2_cpu.items():
            for reg2, a2_ram_region_cost in a2_ram.items():
                if reg == reg2:
                    output['a2'][k]['regions'][reg]['cud-3y'] = nice(v['cpu'] * a2_cpu_region_cost + v[
                        'memory'] * a2_ram_region_cost)

    # M1
    # On Demand and SUD
    m1_ram = data['CP-COMPUTEENGINE-M1-PREDEFINED-VM-RAM']
    m1_cpu = data['CP-COMPUTEENGINE-M1-PREDEFINED-VM-CORE']
    for k, v in m1_instance_types.items():
        if 'ultramem' in k:
            output['m1'][k]['specs'].update({'cores': v['cpu'], 'memory': v['memory'], 'local_ssd': v['local_ssd'],
                                             'network_egress': v['network_egress'], 'benchmark': v['benchmark'],
                                             'cpu': ['Skylake', 'Broadwell E5'], 'gpu': -1, 'sole_tenant': -1,
                                             'nested_virtualization': -1})
        if 'megamem' in k:
            output['m1'][k]['specs'].update({'cores': v['cpu'], 'memory': v['memory'], 'local_ssd': v['local_ssd'],
                                             'network_egress': v['network_egress'], 'benchmark': v['benchmark'],
                                             'cpu': ['Cascade Lake', 'Broadwell E7'], 'gpu': -1, 'sole_tenant': -1,
                                             'nested_virtualization': -1, 'regional_disk': 0})
        for reg, m1_cpu_region_cost in m1_cpu.items():
            for reg2, m1_ram_region_cost in m1_ram.items():
                if reg == reg2:
                    output['m1'][k]['regions'][reg]['ondemand'] = nice(v['cpu'] * m1_cpu_region_cost + v[
                        'memory'] * m1_ram_region_cost)
                    output['m1'][k]['regions'][reg]['sud'] = nice(
                        m1_sud_discount * (v['cpu'] * m1_cpu_region_cost + v[
                            'memory'] * m1_ram_region_cost))
    # Preemptible
    m1_ram = data['CP-COMPUTEENGINE-M1-PREDEFINED-VM-RAM-PREEMPTIBLE']
    m1_cpu = data['CP-COMPUTEENGINE-M1-PREDEFINED-VM-CORE-PREEMPTIBLE']
    for k, v in m1_instance_types.items():
        for reg, m1_cpu_region_cost in m1_cpu.items():
            for reg2, m1_ram_region_cost in m1_ram.items():
                if reg == reg2:
                    output['m1'][k]['regions'][reg]['preemptible'] = nice(v['cpu'] * m1_cpu_region_cost + v[
                        'memory'] * m1_ram_region_cost)
    # CUD - 1 year
    m1_ram = data['CP-COMPUTEENGINE-M1-CUD-1-YEAR-RAM']
    m1_cpu = data['CP-COMPUTEENGINE-M1-CUD-1-YEAR-CPU']
    for k, v in m1_instance_types.items():
        for reg, m1_cpu_region_cost in m1_cpu.items():
            for reg2, m1_ram_region_cost in m1_ram.items():
                if reg == reg2:
                    output['m1'][k]['regions'][reg]['cud-1y'] = nice(v['cpu'] * m1_cpu_region_cost + v[
                        'memory'] * m1_ram_region_cost)
    # CUD - 3 year
    m1_ram = data['CP-COMPUTEENGINE-M1-CUD-3-YEAR-RAM']
    m1_cpu = data['CP-COMPUTEENGINE-M1-CUD-3-YEAR-CPU']
    for k, v in m1_instance_types.items():
        for reg, m1_cpu_region_cost in m1_cpu.items():
            for reg2, m1_ram_region_cost in m1_ram.items():
                if reg == reg2:
                    output['m1'][k]['regions'][reg]['cud-3y'] = nice(v['cpu'] * m1_cpu_region_cost + v[
                        'memory'] * m1_ram_region_cost)

    # M2
    # On Demand and SUD
    m2_ram = data['CP-COMPUTEENGINE-M2-PREDEFINED-VM-RAM']
    m2_cpu = data['CP-COMPUTEENGINE-M2-PREDEFINED-VM-CORE']
    for k, v in m2_instance_types.items():
        output['m2'][k]['specs'].update({'cores': v['cpu'], 'memory': v['memory'], 'local_ssd': v['local_ssd'],
                                         'network_egress': v['network_egress'], 'benchmark': v['benchmark'],
                                         'cpu': ['Cascade Lake'], 'gpu': -1,
                                         'sole_tenant': -1, 'nested_virtualization': -1, 'regional_disk': 0})
        for reg, m2_cpu_region_cost in m2_cpu.items():
            for reg2, m2_ram_region_cost in m2_ram.items():
                if reg == reg2:
                    output['m2'][k]['regions'][reg]['ondemand'] = nice(v['cpu'] * m2_cpu_region_cost + v[
                        'memory'] * m2_ram_region_cost)
                    output['m2'][k]['regions'][reg]['sud'] = nice(
                        m2_sud_discount * (v['cpu'] * m2_cpu_region_cost + v[
                            'memory'] * m2_ram_region_cost))
    # CUD - 1 year
    m2_ram = data['CP-COMPUTEENGINE-M2-CUD-1-YEAR-RAM']
    m2_cpu = data['CP-COMPUTEENGINE-M2-CUD-1-YEAR-CPU']
    for k, v in m2_instance_types.items():
        for reg, m2_cpu_region_cost in m2_cpu.items():
            for reg2, m2_ram_region_cost in m2_ram.items():
                if reg == reg2:
                    output['m2'][k]['regions'][reg]['cud-1y'] = nice(v['cpu'] * m2_cpu_region_cost + v[
                        'memory'] * m2_ram_region_cost)
    # CUD - 3 year
    m2_ram = data['CP-COMPUTEENGINE-M2-CUD-3-YEAR-RAM']
    m2_cpu = data['CP-COMPUTEENGINE-M2-CUD-3-YEAR-CPU']
    for k, v in m2_instance_types.items():
        for reg, m2_cpu_region_cost in m2_cpu.items():
            for reg2, m2_ram_region_cost in m2_ram.items():
                if reg == reg2:
                    output['m2'][k]['regions'][reg]['cud-3y'] = nice(v['cpu'] * m2_cpu_region_cost + v[
                        'memory'] * m2_ram_region_cost)

    # m3
    # On Demand and SUD
    m3_ram = data['CP-COMPUTEENGINE-M3-PREDEFINED-VM-RAM']
    m3_cpu = data['CP-COMPUTEENGINE-M3-PREDEFINED-VM-CORE']
    for k, v in m3_instance_types.items():
        output['m3'][k]['specs'].update({'cores': v['cpu'], 'memory': v['memory'], 'local_ssd': v['local_ssd'],
                                         'network_egress': v['network_egress'], 'benchmark': v['benchmark'],
                                         'cpu': ['Ice Lake'], 'gpu': -1,
                                         'sole_tenant': -1, 'nested_virtualization': -1, 'regional_disk': 0})
        for reg, m3_cpu_region_cost in m3_cpu.items():
            for reg2, m3_ram_region_cost in m3_ram.items():
                if reg == reg2:
                    output['m3'][k]['regions'][reg]['ondemand'] = nice(v['cpu'] * m3_cpu_region_cost + v[
                        'memory'] * m3_ram_region_cost)
                    output['m3'][k]['regions'][reg]['sud'] = nice(
                        m3_sud_discount * (v['cpu'] * m3_cpu_region_cost + v[
                            'memory'] * m3_ram_region_cost))
    # CUD - 1 year
    m3_ram = data['CP-COMPUTEENGINE-M3-CUD-1-YEAR-RAM']
    m3_cpu = data['CP-COMPUTEENGINE-M3-CUD-1-YEAR-CPU']
    for k, v in m3_instance_types.items():
        for reg, m3_cpu_region_cost in m3_cpu.items():
            for reg2, m3_ram_region_cost in m3_ram.items():
                if reg == reg2:
                    output['m3'][k]['regions'][reg]['cud-1y'] = nice(v['cpu'] * m3_cpu_region_cost + v[
                        'memory'] * m3_ram_region_cost)
    # CUD - 3 year
    m3_ram = data['CP-COMPUTEENGINE-M3-CUD-3-YEAR-RAM']
    m3_cpu = data['CP-COMPUTEENGINE-M3-CUD-3-YEAR-CPU']
    for k, v in m3_instance_types.items():
        for reg, m3_cpu_region_cost in m3_cpu.items():
            for reg2, m3_ram_region_cost in m3_ram.items():
                if reg == reg2:
                    output['m3'][k]['regions'][reg]['cud-3y'] = nice(v['cpu'] * m3_cpu_region_cost + v[
                        'memory'] * m3_ram_region_cost)

    # N2
    # On Demand and SUD
    n2_ram = data['CP-COMPUTEENGINE-N2-PREDEFINED-VM-RAM']
    n2_cpu = data['CP-COMPUTEENGINE-N2-PREDEFINED-VM-CORE']
    for k, v in n2_instance_types.items():
        output['n2'][k]['specs'].update({'cores': v['cpu'], 'memory': v['memory'], 'local_ssd': v['local_ssd'],
                                         'network_egress': v['network_egress'], 'benchmark': v['benchmark'],
                                         'cpu': ['Cascade Lake', 'Ice Lake'], 'gpu': 0,
                                         'sole_tenant': 1, 'nested_virtualization': 1, 'regional_disk': 1})
        for reg, n2_cpu_region_cost in n2_cpu.items():
            for reg2, n2_ram_region_cost in n2_ram.items():
                if reg == reg2:
                    output['n2'][k]['regions'][reg]['ondemand'] = nice(
                        v['cpu'] * n2_cpu_region_cost + v['memory'] * n2_ram_region_cost)
                    output['n2'][k]['regions'][reg]['sud'] = nice(
                        n2_sud_discount * (v['cpu'] * n2_cpu_region_cost + v['memory'] * n2_ram_region_cost))

    # Preemptible
    n2_ram = data['CP-COMPUTEENGINE-N2-PREDEFINED-VM-RAM-PREEMPTIBLE']
    n2_cpu = data['CP-COMPUTEENGINE-N2-PREDEFINED-VM-CORE-PREEMPTIBLE']
    for k, v in n2_instance_types.items():
        for reg, n2_cpu_region_cost in n2_cpu.items():
            for reg2, n2_ram_region_cost in n2_ram.items():
                if reg == reg2:
                    output['n2'][k]['regions'][reg]['preemptible'] = nice(v['cpu'] * n2_cpu_region_cost + v[
                        'memory'] * n2_ram_region_cost)
    # CUD - 1 year
    n2_ram = data['CP-COMPUTEENGINE-N2-CUD-1-YEAR-RAM']
    n2_cpu = data['CP-COMPUTEENGINE-N2-CUD-1-YEAR-CPU']
    for k, v in n2_instance_types.items():
        for reg, n2_cpu_region_cost in n2_cpu.items():
            for reg2, n2_ram_region_cost in n2_ram.items():
                if reg == reg2:
                    output['n2'][k]['regions'][reg]['cud-1y'] = nice(v['cpu'] * n2_cpu_region_cost + v[
                        'memory'] * n2_ram_region_cost)
    # CUD - 3 year
    n2_ram = data['CP-COMPUTEENGINE-N2-CUD-3-YEAR-RAM']
    n2_cpu = data['CP-COMPUTEENGINE-N2-CUD-3-YEAR-CPU']
    for k, v in n2_instance_types.items():
        for reg, n2_cpu_region_cost in n2_cpu.items():
            for reg2, n2_ram_region_cost in n2_ram.items():
                if reg == reg2:
                    output['n2'][k]['regions'][reg]['cud-3y'] = nice(v['cpu'] * n2_cpu_region_cost + v[
                        'memory'] * n2_ram_region_cost)

    # N2 VM shapes that are larger than 80 vCPUs use the Intel Ice Lake CPU
    for n2_80coresplus in ['n2-highmem-96', 'n2-highmem-128', 'n2-highcpu-96', 'n2-standard-96', 'n2-standard-128']:
        output['n2'][n2_80coresplus]['specs']['cpu'] = ['Ice Lake']

    # N1 CUDS
    # CUD - 1 year
    n1_ram = data['CP-COMPUTEENGINE-N1-CUD-1-YEAR-RAM']
    n1_cpu = data['CP-COMPUTEENGINE-N1-CUD-1-YEAR-CPU']
    for k, v in n1_instance_types.items():
        for reg, n1_cpu_region_cost in n1_cpu.items():
            for reg2, n1_ram_region_cost in n1_ram.items():
                if reg == reg2:
                    output['n1'][k]['regions'][reg]['cud-1y'] = nice(v['cpu'] * n1_cpu_region_cost + v[
                        'memory'] * n1_ram_region_cost)
    # CUD - 3 year
    n1_ram = data['CP-COMPUTEENGINE-N1-CUD-3-YEAR-RAM']
    n1_cpu = data['CP-COMPUTEENGINE-N1-CUD-3-YEAR-CPU']
    for k, v in n1_instance_types.items():
        for reg, n1_cpu_region_cost in n1_cpu.items():
            for reg2, n1_ram_region_cost in n1_ram.items():
                if reg == reg2:
                    output['n1'][k]['regions'][reg]['cud-3y'] = nice(v['cpu'] * n1_cpu_region_cost + v[
                        'memory'] * n1_ram_region_cost)

    # N2D
    # On Demand and SUD
    n2d_ram = data['CP-COMPUTEENGINE-N2D-PREDEFINED-VM-RAM']
    n2d_cpu = data['CP-COMPUTEENGINE-N2D-PREDEFINED-VM-CORE']
    for k, v in n2d_instance_types.items():
        output['n2d'][k]['specs'].update({'cores': v['cpu'], 'memory': v['memory'], 'local_ssd': v['local_ssd'],
                                          'network_egress': v['network_egress'], 'benchmark': v['benchmark'],
                                          'cpu': ['AMD EPYC Rome', 'AMD EPYC Milan'], 'gpu': 0,
                                          'sole_tenant': 0, 'nested_virtualization': 0, 'regional_disk': 1})
        for reg, n2d_cpu_region_cost in n2d_cpu.items():
            for reg2, n2d_ram_region_cost in n2d_ram.items():
                if reg == reg2:
                    output['n2d'][k]['regions'][reg]['ondemand'] = nice(v['cpu'] * n2d_cpu_region_cost + v[
                        'memory'] * n2d_ram_region_cost)
                    output['n2d'][k]['regions'][reg]['sud'] = nice(n2d_sud_discount * (
                            v['cpu'] * n2d_cpu_region_cost + v[
                        'memory'] * n2d_ram_region_cost))
    # Preemptible
    n2d_ram = data['CP-COMPUTEENGINE-N2D-PREDEFINED-VM-RAM-PREEMPTIBLE']
    n2d_cpu = data['CP-COMPUTEENGINE-N2D-PREDEFINED-VM-CORE-PREEMPTIBLE']
    for k, v in n2d_instance_types.items():
        for reg, n2d_cpu_region_cost in n2d_cpu.items():
            for reg2, n2d_ram_region_cost in n2d_ram.items():
                if reg == reg2:
                    output['n2d'][k]['regions'][reg]['preemptible'] = nice(v['cpu'] * n2d_cpu_region_cost + v[
                        'memory'] * n2d_ram_region_cost)
    # CUD - 1 year
    n2d_ram = data['CP-COMPUTEENGINE-N2D-CUD-1-YEAR-RAM']
    n2d_cpu = data['CP-COMPUTEENGINE-N2D-CUD-1-YEAR-CPU']
    for k, v in n2d_instance_types.items():
        for reg, n2d_cpu_region_cost in n2d_cpu.items():
            for reg2, n2d_ram_region_cost in n2d_ram.items():
                if reg == reg2:
                    output['n2d'][k]['regions'][reg]['cud-1y'] = nice(v['cpu'] * n2d_cpu_region_cost + v[
                        'memory'] * n2d_ram_region_cost)
    # CUD - 3 year
    n2d_ram = data['CP-COMPUTEENGINE-N2D-CUD-3-YEAR-RAM']
    n2d_cpu = data['CP-COMPUTEENGINE-N2D-CUD-3-YEAR-CPU']
    for k, v in n2d_instance_types.items():
        for reg, n2d_cpu_region_cost in n2d_cpu.items():
            for reg2, n2d_ram_region_cost in n2d_ram.items():
                if reg == reg2:
                    output['n2d'][k]['regions'][reg]['cud-3y'] = nice(v['cpu'] * n2d_cpu_region_cost + v[
                        'memory'] * n2d_ram_region_cost)

    # e2
    # On Demand and SUD
    e2_ram = data['CP-COMPUTEENGINE-E2-PREDEFINED-VM-RAM']
    e2_cpu = data['CP-COMPUTEENGINE-E2-PREDEFINED-VM-CORE']
    for k, v in e2_instance_types.items():
        output['e2'][k]['specs'].update({'cores': v['cpu'], 'memory': v['memory'], 'local_ssd': v['local_ssd'],
                                         'network_egress': v['network_egress'], 'benchmark': v['benchmark'],
                                         'cpu': ['Skylake', 'Broadwell', 'Haswell', 'AMD EPYC Rome'],
                                         'gpu': 0, 'sole_tenant': 0, 'nested_virtualization': 0, 'regional_disk': 1})
        for reg, e2_cpu_region_cost in e2_cpu.items():
            for reg2, e2_ram_region_cost in e2_ram.items():
                if reg == reg2:
                    output['e2'][k]['regions'][reg]['ondemand'] = nice(v['cpu'] * e2_cpu_region_cost + v[
                        'memory'] * e2_ram_region_cost)
                    output['e2'][k]['regions'][reg]['sud'] = nice(e2_sud_discount * (
                            v['cpu'] * e2_cpu_region_cost + v[
                        'memory'] * e2_ram_region_cost))
    # Preemptible
    e2_ram = data['CP-COMPUTEENGINE-E2-PREDEFINED-VM-RAM-PREEMPTIBLE']
    e2_cpu = data['CP-COMPUTEENGINE-E2-PREDEFINED-VM-CORE-PREEMPTIBLE']
    for k, v in e2_instance_types.items():
        for reg, e2_cpu_region_cost in e2_cpu.items():
            for reg2, e2_ram_region_cost in e2_ram.items():
                if reg == reg2:
                    output['e2'][k]['regions'][reg]['preemptible'] = nice(v['cpu'] * e2_cpu_region_cost + v[
                        'memory'] * e2_ram_region_cost)
    # CUD - 1 year
    e2_ram = data['CP-COMPUTEENGINE-E2-CUD-1-YEAR-RAM']
    e2_cpu = data['CP-COMPUTEENGINE-E2-CUD-1-YEAR-CPU']
    for k, v in e2_instance_types.items():
        for reg, e2_cpu_region_cost in e2_cpu.items():
            for reg2, e2_ram_region_cost in e2_ram.items():
                if reg == reg2:
                    output['e2'][k]['regions'][reg]['cud-1y'] = nice(v['cpu'] * e2_cpu_region_cost + v[
                        'memory'] * e2_ram_region_cost)
    # CUD - 3 year
    e2_ram = data['CP-COMPUTEENGINE-E2-CUD-3-YEAR-RAM']
    e2_cpu = data['CP-COMPUTEENGINE-E2-CUD-3-YEAR-CPU']
    for k, v in e2_instance_types.items():
        for reg, e2_cpu_region_cost in e2_cpu.items():
            for reg2, e2_ram_region_cost in e2_ram.items():
                if reg == reg2:
                    output['e2'][k]['regions'][reg]['cud-3y'] = nice(v['cpu'] * e2_cpu_region_cost + v[
                        'memory'] * e2_ram_region_cost)

    # T2D
    # On Demand and SUD
    t2d_ram = data['CP-COMPUTEENGINE-T2D-PREDEFINED-VM-RAM']
    t2d_cpu = data['CP-COMPUTEENGINE-T2D-PREDEFINED-VM-CORE']
    for k, v in t2d_instance_types.items():
        output['t2d'][k]['specs'].update({'cores': v['cpu'], 'memory': v['memory'], 'local_ssd': v['local_ssd'],
                                          'network_egress': v['network_egress'], 'benchmark': v['benchmark'],
                                          'cpu': ['AMD EPYC Milan'], 'gpu': 0,
                                          'sole_tenant': 0, 'nested_virtualization': 0, 'regional_disk': 1})
        for reg, t2d_cpu_region_cost in t2d_cpu.items():
            for reg2, t2d_ram_region_cost in t2d_ram.items():
                if reg == reg2:
                    output['t2d'][k]['regions'][reg]['ondemand'] = nice(v['cpu'] * t2d_cpu_region_cost + v[
                        'memory'] * t2d_ram_region_cost)
                    output['t2d'][k]['regions'][reg]['sud'] = nice(
                        t2d_sud_discount * (v['cpu'] * t2d_cpu_region_cost + v[
                            'memory'] * t2d_ram_region_cost))
    # Preemptible
    t2d_ram = data['CP-COMPUTEENGINE-T2D-PREDEFINED-VM-RAM-PREEMPTIBLE']
    t2d_cpu = data['CP-COMPUTEENGINE-T2D-PREDEFINED-VM-CORE-PREEMPTIBLE']
    for k, v in t2d_instance_types.items():
        for reg, t2d_cpu_region_cost in t2d_cpu.items():
            for reg2, t2d_ram_region_cost in t2d_ram.items():
                if reg == reg2:
                    output['t2d'][k]['regions'][reg]['preemptible'] = nice(v['cpu'] * t2d_cpu_region_cost + v[
                        'memory'] * t2d_ram_region_cost)
    # CUD - 1 year
    t2d_ram = data['CP-COMPUTEENGINE-T2D-CUD-1-YEAR-RAM']
    t2d_cpu = data['CP-COMPUTEENGINE-T2D-CUD-1-YEAR-CPU']
    for k, v in t2d_instance_types.items():
        for reg, t2d_cpu_region_cost in t2d_cpu.items():
            for reg2, t2d_ram_region_cost in t2d_ram.items():
                if reg == reg2:
                    output['t2d'][k]['regions'][reg]['cud-1y'] = nice(v['cpu'] * t2d_cpu_region_cost + v[
                        'memory'] * t2d_ram_region_cost)
    # CUD - 3 year
    t2d_ram = data['CP-COMPUTEENGINE-T2D-CUD-3-YEAR-RAM']
    t2d_cpu = data['CP-COMPUTEENGINE-T2D-CUD-3-YEAR-CPU']
    for k, v in t2d_instance_types.items():
        for reg, t2d_cpu_region_cost in t2d_cpu.items():
            for reg2, t2d_ram_region_cost in t2d_ram.items():
                if reg == reg2:
                    output['t2d'][k]['regions'][reg]['cud-3y'] = nice(v['cpu'] * t2d_cpu_region_cost + v[
                        'memory'] * t2d_ram_region_cost)

    # T2A
    # On Demand and SUD
    t2a_ram = data['CP-COMPUTEENGINE-T2A-PREDEFINED-VM-RAM']
    t2a_cpu = data['CP-COMPUTEENGINE-T2A-PREDEFINED-VM-CORE']
    for k, v in t2a_instance_types.items():
        output['t2a'][k]['specs'].update({'cores': v['cpu'], 'memory': v['memory'], 'local_ssd': v['local_ssd'],
                                          'network_egress': v['network_egress'], 'benchmark': v['benchmark'],
                                          'cpu': ['Ampere Altra'], 'gpu': 0,
                                          'sole_tenant': 0, 'nested_virtualization': 0, 'regional_disk': 1})
        for reg, t2a_cpu_region_cost in t2a_cpu.items():
            for reg2, t2a_ram_region_cost in t2a_ram.items():
                if reg == reg2:
                    output['t2a'][k]['regions'][reg]['ondemand'] = nice(v['cpu'] * t2a_cpu_region_cost + v[
                        'memory'] * t2a_ram_region_cost)
                    output['t2a'][k]['regions'][reg]['sud'] = nice(
                        t2a_sud_discount * (v['cpu'] * t2a_cpu_region_cost + v[
                            'memory'] * t2a_ram_region_cost))
    # Preemptible
    t2a_ram = data['CP-COMPUTEENGINE-T2A-PREDEFINED-VM-RAM-PREEMPTIBLE']
    t2a_cpu = data['CP-COMPUTEENGINE-T2A-PREDEFINED-VM-CORE-PREEMPTIBLE']
    for k, v in t2a_instance_types.items():
        for reg, t2a_cpu_region_cost in t2a_cpu.items():
            for reg2, t2a_ram_region_cost in t2a_ram.items():
                if reg == reg2:
                    output['t2a'][k]['regions'][reg]['preemptible'] = nice(v['cpu'] * t2a_cpu_region_cost + v[
                        'memory'] * t2a_ram_region_cost)
    print(json.dumps(output))
