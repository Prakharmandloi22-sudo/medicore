import { Request, Response, NextFunction } from 'express';
import { fhirService } from '../services/fhirService';
import { db } from '../db';

export const exportPatientBundle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patientId = req.params.patientId || (req.query.patientId as string);
    if (!patientId) {
      res.status(400).json({ error: { code: 'PATIENT_ID_REQUIRED', message: 'patientId is required for FHIR export.' } });
      return;
    }
    const bundle = await fhirService.exportPatientBundle(patientId, req.user?.id);
    res.setHeader('Content-Type', 'application/fhir+json');
    res.status(200).json(bundle);
  } catch (err) {
    next(err);
  }
};

export const importFhirBundle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await fhirService.importFhirBundle(req.body, req.user?.id);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

export const getFhirResource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { resourceType, id } = req.params;

    if (resourceType === 'Patient') {
      const p = db.patients.find(pat => pat.id === id);
      if (!p) {
        res.status(404).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'not-found', diagnostics: 'Patient not found' }] });
        return;
      }
      res.setHeader('Content-Type', 'application/fhir+json');
      res.status(200).json(fhirService.toFhirPatient(p));
      return;
    }

    if (resourceType === 'Appointment') {
      const a = db.appointments.find(apt => apt.id === id);
      if (!a) {
        res.status(404).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'not-found', diagnostics: 'Appointment not found' }] });
        return;
      }
      res.setHeader('Content-Type', 'application/fhir+json');
      res.status(200).json(fhirService.toFhirAppointment(a));
      return;
    }

    if (resourceType === 'Observation') {
      const lr = db.labResults.find(r => r.id === id);
      if (!lr) {
        res.status(404).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'not-found', diagnostics: 'Observation not found' }] });
        return;
      }
      res.setHeader('Content-Type', 'application/fhir+json');
      res.status(200).json(fhirService.toFhirObservation(lr));
      return;
    }

    res.status(400).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'not-supported', diagnostics: `ResourceType ${resourceType} not supported` }] });
  } catch (err) {
    next(err);
  }
};
