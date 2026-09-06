import unittest
import build_public as b
class ProjectionTests(unittest.TestCase):
    def test_serial_identity(self):
        e={'set':'MAMO-EN007','serial':'77 /100e'}
        self.assertEqual(b.identity(e),'MAMO-EN007|077/100E')
        self.assertNotEqual(b.identity(e),b.identity(dict(e,serial='077/100')))
        self.assertNotEqual(b.identity(e),b.identity(dict(e,set='MAMO-EN014')))
        for serial in ['???/100','025/???','000/100','101/100','77/100?']:
            self.assertIsNone(b.identity(dict(e,serial=serial)))
    def test_dedupe_and_privacy(self):
        e={'set':'MAMO-EN007','card':'Stardust','serial':'77/100','country_public':'United States','reporter':'DO_NOT_PUBLISH','source_url':'https://example.com/private','private_place':'DO_NOT_PUBLISH'}
        result=b.project({'updated':'2026-09-06','entries':[e,dict(e,serial='077/100'),dict(e,serial='077/100E'),dict(e,serial='???/100')]},{'entries':[]})
        self.assertEqual(len(result['serials']),2);self.assertEqual(result['serials'][0]['reports'],2);self.assertEqual(len(result['pending']),1)
        self.assertNotIn('DO_NOT_PUBLISH',str(result));self.assertNotIn('source_url',str(result))
    def test_country_conflicts(self):
        e={'set':'MAMO-EN003','card':'Curtain','serial':'11/100','country_public':'Canada'}
        result=b.project({'updated':'2026-09-06','entries':[e,dict(e,country_public='United States')]},{'entries':[]})
        self.assertEqual(result['serials'][0]['country'],'Unknown')
        with self.assertRaises(ValueError):b.country(dict(e,country_public='US West Coast'))
if __name__=='__main__':unittest.main()
