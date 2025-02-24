import unittest
from src.focus_forge import add_session
from unittest.mock import patch
from io import StringIO

class TestAddSession(unittest.TestCase):

    def test_format_duration(self):
        self.assertEqual(add_session.format_duration(0), "00:00:00")
        self.assertEqual(add_session.format_duration(60), "00:01:00")
        self.assertEqual(add_session.format_duration(3600), "01:00:00")
        self.assertEqual(add_session.format_duration(3661), "01:01:01")

    @patch('src.focus_forge.add_session.input', return_value='y')
    @patch('src.focus_forge.add_session.db_utils.insert_session')
    @patch('sys.stdout', new_callable=StringIO)
    def test_add_start_session(self, mock_stdout, mock_insert_session, mock_input):
        add_session.add_start_session()
        self.assertIn("Starting a new session", mock_stdout.getvalue())
        mock_insert_session.assert_called_once()

    @patch('src.focus_forge.add_session.input', return_value='y')
    @patch('src.focus_forge.add_session.db_utils.stop_session')
    @patch('src.focus_forge.add_session.db_utils.get_last_session', return_value=('2024-01-01', '10:00:00'))
    @patch('sys.stdout', new_callable=StringIO)
    def test_add_stop_session(self, mock_stdout, mock_get_last_session, mock_stop_session, mock_input):
        add_session.add_stop_session()
        self.assertIn("Stopping last session", mock_stdout.getvalue())
        mock_stop_session.assert_called_once()

    @patch('src.focus_forge.add_session.input', side_effect=['2024-01-01 10:00-11:00', 'y', 'y'])
    @patch('src.focus_forge.add_session.db_utils.insert_session')
    @patch('sys.stdout', new_callable=StringIO)
    def test_add_manual_session(self, mock_stdout, mock_insert_session, mock_input):
        add_session.add_manual_session()
        self.assertIn("Adding manual session", mock_stdout.getvalue())
        mock_insert_session.assert_called_once()


if __name__ == '__main__':
    unittest.main()
