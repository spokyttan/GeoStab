import os
import sys
from unittest.mock import MagicMock

# Mock mysql and mysql.connector before importing the module that uses it
mock_mysql = MagicMock()
sys.modules['mysql'] = mock_mysql
sys.modules['mysql.connector'] = mock_mysql.connector

import unittest
from unittest.mock import patch

# Now import the module under test
sys.path.append(os.path.join(os.getcwd(), 'src'))
from db_utils.connection import get_db_connection

class TestConnection(unittest.TestCase):
    @patch.dict(os.environ, {}, clear=True)
    def test_get_db_connection_default_user(self):
        try:
            with get_db_connection() as conn:
                pass
        except Exception as e:
            print(f"Exception during connection: {e}")

        # Check what user was passed to connect
        self.assertTrue(mock_mysql.connector.connect.called)
        args, kwargs = mock_mysql.connector.connect.call_args
        print(f"DEBUG: kwargs passed to connect: {kwargs}")
        self.assertEqual(kwargs.get('user'), 'capitan')

if __name__ == '__main__':
    unittest.main()
