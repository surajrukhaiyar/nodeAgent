import xml.etree.ElementTree as ET
import os
import sys
import shutil

src_path = 'C:\\Users\\suraj.r.EXIMR-D-015\\Desktop\\loggerTest_main\\workflows'
logStr = ''

ET.register_namespace('bpmn2',"http://www.omg.org/spec/BPMN/20100524/MODEL") #some name
ET.register_namespace('xs', "http://www.w3.org/2001/XMLSchema")
ET.register_namespace('xsi', "http://www.w3.org/2001/XMLSchema-instance")
ET.register_namespace('bpmndi', "http://www.omg.org/spec/BPMN/20100524/DI")
ET.register_namespace('dc', "http://www.omg.org/spec/DD/20100524/DC")
ET.register_namespace('di', "http://www.omg.org/spec/DD/20100524/DI")

for wf_file in os.listdir(src_path):
	wf_tree = ET.parse(src_path + '\\' + wf_file)
	wf_file_name = os.path.splitext(wf_file)[0]
	srcRef = ''
	trgRef = ''
	#look for bpmn2:sequenceFlow with sourceRef = "StartEvent_1"
	#get targetRef
	for elem in wf_tree.getiterator():
		srcRef = elem.get('sourceRef')
		if srcRef == 'StartEvent_1':
			trgRef = elem.get('targetRef')
			
	#look for bpmn2:task with id = targetRef
	#update DefinedLogs and prelog	
	for elem in wf_tree.getiterator():
		if trgRef == elem.get('id'):
			elem.set('DefinedLogs', 'fusionLogger')
			elem.set('prelog', wf_file_name + ',' + 'Completed')
			print('prelog added')
		

	#look for bpmn2:sequenceFlow with targetRef = "EndEvent_1"
	#get sourceRef
	for elem in wf_tree.getiterator():
		trgRef = elem.get('targetRef')
		if trgRef == 'EndEvent_1':
			srcRef = elem.get('sourceRef')
		
	#look for bpmn2:task with id = sourceRef
	#update DefinedLogs and prelog
	for elem in wf_tree.getiterator():
		if srcRef == elem.get('id'):
			elem.set('DefinedLogs', 'fusionLogger')
			elem.set('postlog', wf_file_name + ',' + 'Processing')
			print('postLog added')
		
	wf_tree.write(open(src_path + '\\' + wf_file, 'wb'), encoding='UTF-8', xml_declaration=True, default_namespace=None, method="xml")